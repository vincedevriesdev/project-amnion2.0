package net.opik.amnion.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager.NameNotFoundException
import android.net.ConnectivityManager
import android.net.IpPrefix
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.os.Process
import android.system.OsConstants
import android.util.Log
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
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.InterfaceAddress
import java.net.NetworkInterface
import java.util.concurrent.atomic.AtomicBoolean
import io.nekohasekai.libbox.NetworkInterface as BoxNetworkInterface

class AmnionVpnService : VpnService(), PlatformInterface, CommandServerHandler {
    private var commandServer: CommandServer? = null
    private var tunDescriptor: ParcelFileDescriptor? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val starting = AtomicBoolean(false)
    @Volatile private var stopRequested = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTunnel()
            return START_NOT_STICKY
        }
        stopRequested = false
        // Android requires foreground promotion within a few seconds of
        // startForegroundService(), including while libbox is still starting.
        showNotification("Verbinden…", foreground = true)
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
                saveDiagnostic("config-controleren")
                val profile = SecureProfileStore(this).load() ?: error("Geen VPN-profiel opgeslagen")
                Libbox.checkConfig(profile.configJson)
                saveDiagnostic("vpn-engine-starten")
                Libbox.promoteOOMDraft()
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
                showNotification("Verbonden met ${profile.regionLabel}", foreground = true)
                saveDiagnostic("verbonden")
                sendStatus(STATUS_CONNECTED)
            } catch (error: Throwable) {
                closeEngine()
                saveDiagnostic("fout: ${error.javaClass.simpleName}: ${error.message.orEmpty()}")
                Log.e(TAG, "VPN kon niet starten", error)
                sendStatus(STATUS_ERROR, error.message ?: "VPN kon niet starten")
                runCatching { getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID) }
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
        runCatching { getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID) }
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

    private fun showNotification(status: String, foreground: Boolean) {
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
        if (foreground) startForeground(NOTIFICATION_ID, notification)
        else manager.notify(NOTIFICATION_ID, notification)
    }

    private fun saveDiagnostic(stage: String) {
        getSharedPreferences("amnion_diagnostics", Context.MODE_PRIVATE)
            .edit().putString("last_vpn_stage", stage).apply()
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

        val inet4Address = options.inet4Address
        while (inet4Address.hasNext()) {
            val address = inet4Address.next()
            builder.addAddress(address.address(), address.prefix())
        }
        val inet6Address = options.inet6Address
        while (inet6Address.hasNext()) {
            val address = inet6Address.next()
            builder.addAddress(address.address(), address.prefix())
        }

        if (options.autoRoute) {
            if (options.dnsMode.value != Libbox.DNSModeDisabled) {
                val dnsServerAddress = options.dnsServerAddress
                while (dnsServerAddress.hasNext()) builder.addDnsServer(dnsServerAddress.next())
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val inet4Routes = options.inet4RouteAddress
                while (inet4Routes.hasNext()) builder.addRoute(inet4Routes.next().toIpPrefix())
                val inet6Routes = options.inet6RouteAddress
                while (inet6Routes.hasNext()) builder.addRoute(inet6Routes.next().toIpPrefix())
                val inet4Excludes = options.inet4RouteExcludeAddress
                while (inet4Excludes.hasNext()) builder.excludeRoute(inet4Excludes.next().toIpPrefix())
                val inet6Excludes = options.inet6RouteExcludeAddress
                while (inet6Excludes.hasNext()) builder.excludeRoute(inet6Excludes.next().toIpPrefix())
            } else {
                val inet4Routes = options.inet4RouteRange
                while (inet4Routes.hasNext()) {
                    val route = inet4Routes.next()
                    builder.addRoute(route.address(), route.prefix())
                }
                val inet6Routes = options.inet6RouteRange
                while (inet6Routes.hasNext()) {
                    val route = inet6Routes.next()
                    builder.addRoute(route.address(), route.prefix())
                }
            }

            val includePackage = options.includePackage
            while (includePackage.hasNext()) {
                try { builder.addAllowedApplication(includePackage.next()) }
                catch (_: NameNotFoundException) { }
            }
            val excludePackage = options.excludePackage
            while (excludePackage.hasNext()) {
                try { builder.addDisallowedApplication(excludePackage.next()) }
                catch (_: NameNotFoundException) { }
            }
        }

        saveDiagnostic("vpn-interface-maken")
        val descriptor = builder.establish() ?: error("Android kon geen VPN-interface maken")
        tunDescriptor = descriptor
        return descriptor.fd
    }

    override fun usePlatformAutoDetectInterfaceControl(): Boolean = true
    override fun autoDetectInterfaceControl(fd: Int) {
        protect(fd)
    }
    override fun useProcFS(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
    override fun underNetworkExtension(): Boolean = false
    override fun includeAllNetworks(): Boolean = false
    override fun clearDNSCache() = Unit
    override fun localDNSTransport(): LocalDNSTransport? = null
    override fun readWIFIState(): WIFIState? = null
    override fun tailscaleHostname(): String = Build.MODEL
    override fun registerMyInterface(name: String?) = Unit

    override fun getInterfaces(): NetworkInterfaceIterator {
        val nativeInterfaces = NetworkInterface.getNetworkInterfaces()?.toList().orEmpty()
        val items = connectivity().allNetworks.mapNotNull { network ->
            val links = connectivity().getLinkProperties(network) ?: return@mapNotNull null
            val capabilities = connectivity().getNetworkCapabilities(network) ?: return@mapNotNull null
            val native = nativeInterfaces.firstOrNull { it.name == links.interfaceName } ?: return@mapNotNull null
            BoxNetworkInterface().apply {
                name = native.name
                index = native.index
                mtu = runCatching { native.mtu }.getOrDefault(1500)
                addresses = StringArray(native.interfaceAddresses.map { it.toPrefix() }.iterator())
                dnsServer = StringArray(links.dnsServers.mapNotNull { it.hostAddress }.iterator())
                gateway = StringArray(links.routes.filter { it.destination.prefixLength == 0 }
                    .mapNotNull { it.gateway?.hostAddress }.iterator())
                flags = (if (capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))
                    OsConstants.IFF_UP or OsConstants.IFF_RUNNING else 0) or
                    (if (native.isLoopback) OsConstants.IFF_LOOPBACK else 0) or
                    (if (native.isPointToPoint) OsConstants.IFF_POINTOPOINT else 0)
                type = when {
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> Libbox.InterfaceTypeWIFI
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> Libbox.InterfaceTypeCellular
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> Libbox.InterfaceTypeEthernet
                    else -> Libbox.InterfaceTypeOther
                }
                metered = !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
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
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_RESTRICTED)
            .build()
        when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
                connectivity().registerBestMatchingNetworkCallback(request, callback, mainHandler)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ->
                connectivity().requestNetwork(request, callback, mainHandler)
            else -> connectivity().registerDefaultNetworkCallback(callback, mainHandler)
        }
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

    override fun findConnectionOwner(ipProtocol: Int, sourceAddress: String?, sourcePort: Int, destinationAddress: String?, destinationPort: Int): ConnectionOwner {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) throw UnsupportedOperationException("Android 10 is vereist")
        val source = sourceAddress ?: throw IllegalArgumentException("Bronadres ontbreekt")
        val destination = destinationAddress ?: throw IllegalArgumentException("Doeladres ontbreekt")
        val uid = connectivity().getConnectionOwnerUid(
            ipProtocol,
            InetSocketAddress(source, sourcePort),
            InetSocketAddress(destination, destinationPort)
        )
        if (uid == Process.INVALID_UID) error("Android kon de verbindingseigenaar niet bepalen")
        val packages = packageManager.getPackagesForUid(uid).orEmpty()
        return ConnectionOwner().apply {
            userId = uid
            userName = packages.firstOrNull().orEmpty()
            setAndroidPackageNames(StringArray(packages.iterator()))
        }
    }
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
        private const val TAG = "AmnionVpnService"

        fun start(context: Context) {
            context.startForegroundService(Intent(context, AmnionVpnService::class.java))
        }

        fun stop(context: Context) {
            context.startService(Intent(context, AmnionVpnService::class.java).setAction(ACTION_STOP))
        }
    }
}

@androidx.annotation.RequiresApi(Build.VERSION_CODES.TIRAMISU)
private fun io.nekohasekai.libbox.RoutePrefix.toIpPrefix() =
    IpPrefix(InetAddress.getByName(address()), prefix())

private fun InterfaceAddress.toPrefix(): String = if (address is Inet6Address) {
    "${Inet6Address.getByAddress(address.address).hostAddress}/$networkPrefixLength"
} else {
    "${address.hostAddress}/$networkPrefixLength"
}
