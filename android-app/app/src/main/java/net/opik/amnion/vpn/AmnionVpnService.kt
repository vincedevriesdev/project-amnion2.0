package net.opik.amnion.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.IpPrefix
import android.net.Network
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import io.nekohasekai.libbox.BridgeOptions
import io.nekohasekai.libbox.BridgeSession
import io.nekohasekai.libbox.CommandServer
import io.nekohasekai.libbox.CommandServerHandler
import io.nekohasekai.libbox.ConnectionOwner
import io.nekohasekai.libbox.InterfaceUpdateListener
import io.nekohasekai.libbox.Libbox
import io.nekohasekai.libbox.LocalDNSTransport
import io.nekohasekai.libbox.NeighborEntryIterator
import io.nekohasekai.libbox.NeighborUpdateListener
import io.nekohasekai.libbox.NetworkInterfaceIterator
import io.nekohasekai.libbox.Notification
import io.nekohasekai.libbox.OverrideOptions
import io.nekohasekai.libbox.PlatformInterface
import io.nekohasekai.libbox.PlatformUser
import io.nekohasekai.libbox.ShellSession
import io.nekohasekai.libbox.StringIterator
import io.nekohasekai.libbox.SystemProxyStatus
import io.nekohasekai.libbox.TunOptions
import io.nekohasekai.libbox.WIFIState
import net.opik.amnion.MainActivity
import net.opik.amnion.R
import net.opik.amnion.data.SecureProfileStore
import java.net.Inet6Address
import java.net.NetworkInterface
import java.util.concurrent.atomic.AtomicBoolean
import io.nekohasekai.libbox.NetworkInterface as BoxNetworkInterface

class AmnionVpnService : VpnService(), PlatformInterface, CommandServerHandler {
    private var commandServer: CommandServer? = null
    private var tunDescriptor: ParcelFileDescriptor? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val starting = AtomicBoolean(false)
    @Volatile private var stopRequested = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTunnel()
            return START_NOT_STICKY
        }
        stopRequested = false
        showForeground("Verbinden…")
        startTunnel()
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent): IBinder? = super.onBind(intent)

    override fun onRevoke() = stopTunnel()

    override fun onDestroy() {
        closeEngine()
        super.onDestroy()
    }

    private fun startTunnel() {
        if (!starting.compareAndSet(false, true)) return
        Thread {
            try {
                sendStatus(STATUS_CONNECTING)
                val profile = SecureProfileStore(this).load() ?: error("Geen VPN-profiel opgeslagen")
                Libbox.checkConfig(profile.configJson)
                val server = CommandServer(this, this)
                server.start()
                server.startOrReloadService(profile.configJson, OverrideOptions())
                commandServer = server
                if (stopRequested) {
                    closeEngine()
                    sendStatus(STATUS_DISCONNECTED)
                    stopSelf()
                    return@Thread
                }
                showForeground("Verbonden met ${profile.regionLabel}")
                sendStatus(STATUS_CONNECTED)
            } catch (error: Exception) {
                closeEngine()
                sendStatus(STATUS_ERROR, error.message ?: "VPN kon niet starten")
                stopSelf()
            } finally {
                starting.set(false)
            }
        }.start()
    }

    private fun stopTunnel() {
        stopRequested = true
        closeEngine()
        sendStatus(STATUS_DISCONNECTED)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun closeEngine() {
        runCatching { commandServer?.closeService() }
        runCatching { commandServer?.close() }
        commandServer = null
        runCatching { tunDescriptor?.close() }
        tunDescriptor = null
        networkCallback?.let { callback ->
            runCatching { connectivity().unregisterNetworkCallback(callback) }
        }
        networkCallback = null
    }

    private fun showForeground(status: String) {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(NotificationChannel(
                CHANNEL_ID,
                getString(R.string.vpn_notification_channel),
                NotificationManager.IMPORTANCE_LOW
            ))
        }
        val openIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this, 1, Intent(this, AmnionVpnService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_shield)
            .setContentTitle(getString(R.string.vpn_notification_title))
            .setContentText(status)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .addAction(0, "Verbreken", stopIntent)
            .build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun sendStatus(status: String, message: String? = null) {
        sendBroadcast(Intent(ACTION_STATUS).setPackage(packageName).apply {
            putExtra(EXTRA_STATUS, status)
            putExtra(EXTRA_MESSAGE, message)
        })
    }

    override fun openTun(options: TunOptions): Int {
        check(prepare(this) == null) { "Android VPN-toestemming ontbreekt" }
        val builder = Builder().setSession("Amnion VPN").setMtu(options.mtu)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) builder.setMetered(false)

        val ipv4 = options.inet4Address.collectRoutes()
        val ipv6 = options.inet6Address.collectRoutes()
        (ipv4 + ipv6).forEach { builder.addAddress(it.address(), it.prefix()) }

        if (options.autoRoute) {
            builder.addRoute("0.0.0.0", 0)
            if (ipv6.isNotEmpty()) builder.addRoute("::", 0)
        }

        val dnsServers = runCatching { options.dnsServerAddress.collectStrings() }.getOrDefault(emptyList())
        if (dnsServers.isEmpty()) {
            builder.addDnsServer("172.19.0.2")
        } else {
            dnsServers.forEach(builder::addDnsServer)
        }

        options.includePackage.collectStrings().forEach { runCatching { builder.addAllowedApplication(it) } }
        options.excludePackage.collectStrings().forEach { runCatching { builder.addDisallowedApplication(it) } }
        val descriptor = builder.establish() ?: error("Android kon geen VPN-interface maken")
        tunDescriptor = descriptor
        return descriptor.fd
    }

    override fun usePlatformAutoDetectInterfaceControl(): Boolean = true
    override fun autoDetectInterfaceControl(fd: Int) { protect(fd) }
    override fun useProcFS(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
    override fun underNetworkExtension(): Boolean = false
    override fun includeAllNetworks(): Boolean = false
    override fun clearDNSCache() = Unit
    override fun localDNSTransport(): LocalDNSTransport? = null
    override fun readWIFIState(): WIFIState? = null
    override fun tailscaleHostname(): String = Build.MODEL
    override fun registerMyInterface(name: String?) = Unit

    override fun getInterfaces(): NetworkInterfaceIterator {
        val items = NetworkInterface.getNetworkInterfaces().toList().map { native ->
            BoxNetworkInterface().apply {
                name = native.name
                index = native.index
                mtu = runCatching { native.mtu }.getOrDefault(1500)
                addresses = StringArray(native.interfaceAddresses.mapNotNull { item ->
                    item.address?.hostAddress?.let { "$it/${item.networkPrefixLength}" }
                }.iterator())
                dnsServer = StringArray(emptyList<String>().iterator())
                gateway = StringArray(emptyList<String>().iterator())
                flags = 0
                type = Libbox.InterfaceTypeOther
                metered = false
            }
        }
        return InterfaceArray(items.iterator())
    }

    override fun startDefaultInterfaceMonitor(listener: InterfaceUpdateListener) {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) = updateDefaultInterface(listener, network)
            override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) =
                updateDefaultInterface(listener, network)
        }
        networkCallback = callback
        connectivity().registerDefaultNetworkCallback(callback)
        connectivity().activeNetwork?.let { updateDefaultInterface(listener, it) }
    }

    override fun closeDefaultInterfaceMonitor(listener: InterfaceUpdateListener?) {
        networkCallback?.let { runCatching { connectivity().unregisterNetworkCallback(it) } }
        networkCallback = null
    }

    private fun updateDefaultInterface(listener: InterfaceUpdateListener, network: Network) {
        val name = connectivity().getLinkProperties(network)?.interfaceName ?: return
        val index = runCatching { NetworkInterface.getByName(name)?.index ?: 0 }.getOrDefault(0)
        val capabilities = connectivity().getNetworkCapabilities(network)
        val metered = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == false
        listener.updateDefaultInterface(name, index, metered, false)
    }

    private fun connectivity() = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    override fun findConnectionOwner(ipProtocol: Int, sourceAddress: String?, sourcePort: Int, destinationAddress: String?, destinationPort: Int): ConnectionOwner =
        throw UnsupportedOperationException("Process lookup is niet nodig voor Amnion")
    override fun startNeighborMonitor(listener: NeighborUpdateListener?) = Unit
    override fun closeNeighborMonitor(listener: NeighborUpdateListener?) = Unit
    override fun usePlatformBridge(): Boolean = false
    override fun createBridge(options: BridgeOptions?): BridgeSession = throw UnsupportedOperationException()
    override fun usePlatformShell(): Boolean = false
    override fun checkPlatformShell() = throw UnsupportedOperationException()
    override fun openShellSession(user: PlatformUser?, command: String?, environ: StringIterator?, term: String?, rows: Int, cols: Int): ShellSession =
        throw UnsupportedOperationException()
    override fun lookupUser(username: String?): PlatformUser = throw UnsupportedOperationException()
    override fun lookupSFTPServer(): String = throw UnsupportedOperationException()
    override fun readSystemSSHHostKey(): String = throw UnsupportedOperationException()
    override fun sendNotification(notification: Notification?) = Unit
    override fun cancelNotification(identifier: String?, typeID: Int) = Unit

    override fun serviceStop() = stopTunnel()
    override fun serviceReload() = Unit
    override fun getSystemProxyStatus(): SystemProxyStatus = SystemProxyStatus().apply {
        available = false
        enabled = false
    }
    override fun setSystemProxyEnabled(enabled: Boolean) = Unit
    override fun connectSSHAgent(): Int = -1
    override fun triggerNativeCrash() = Unit
    override fun writeDebugMessage(message: String?) = Unit

    private class StringArray(private val iterator: Iterator<String>) : StringIterator {
        override fun len(): Int = 0
        override fun hasNext(): Boolean = iterator.hasNext()
        override fun next(): String = iterator.next()
    }

    private class InterfaceArray(private val iterator: Iterator<BoxNetworkInterface>) : NetworkInterfaceIterator {
        override fun hasNext(): Boolean = iterator.hasNext()
        override fun next(): BoxNetworkInterface = iterator.next()
    }

    companion object {
        const val ACTION_STATUS = "net.opik.amnion.VPN_STATUS"
        const val EXTRA_STATUS = "status"
        const val EXTRA_MESSAGE = "message"
        const val STATUS_DISCONNECTED = "disconnected"
        const val STATUS_CONNECTING = "connecting"
        const val STATUS_CONNECTED = "connected"
        const val STATUS_ERROR = "error"
        private const val ACTION_STOP = "net.opik.amnion.STOP"
        private const val CHANNEL_ID = "amnion_vpn"
        private const val NOTIFICATION_ID = 1702

        fun start(context: Context) {
            context.startForegroundService(Intent(context, AmnionVpnService::class.java))
        }

        fun stop(context: Context) {
            context.startService(Intent(context, AmnionVpnService::class.java).setAction(ACTION_STOP))
        }
    }
}

private fun io.nekohasekai.libbox.RoutePrefixIterator.collectRoutes(): List<io.nekohasekai.libbox.RoutePrefix> =
    buildList { while (hasNext()) add(next()) }

private fun StringIterator.collectStrings(): List<String> = buildList { while (hasNext()) add(next()) }
