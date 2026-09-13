package net.opik.amnion

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import net.opik.amnion.data.ConnectionState
import net.opik.amnion.data.Region
import net.opik.amnion.data.VpnProtocol
import net.opik.amnion.vpn.AmnionVpnService

private val Night = Color(0xFF060D19)
private val Panel = Color(0xFF101B2D)
private val PanelLight = Color(0xFF17243A)
private val Purple = Color(0xFF7B61FF)
private val Cyan = Color(0xFF35D3F2)
private val Mint = Color(0xFF43E3A4)
private val Muted = Color(0xFFA5B0C5)
private val Danger = Color(0xFFFF7185)
private val White = Color(0xFFF7F9FF)

class MainActivity : ComponentActivity() {
    private val viewModel by viewModels<MainViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val permissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.StartActivityForResult()
            ) { result ->
                if (result.resultCode == RESULT_OK) AmnionVpnService.start(this)
            }

            DisposableEffect(Unit) {
                val receiver = object : BroadcastReceiver() {
                    override fun onReceive(context: Context?, intent: Intent?) {
                        viewModel.updateConnection(
                            intent?.getStringExtra(AmnionVpnService.EXTRA_STATUS).orEmpty(),
                            intent?.getStringExtra(AmnionVpnService.EXTRA_MESSAGE)
                        )
                    }
                }
                ContextCompat.registerReceiver(
                    this@MainActivity,
                    receiver,
                    IntentFilter(AmnionVpnService.ACTION_STATUS),
                    ContextCompat.RECEIVER_NOT_EXPORTED
                )
                onDispose { unregisterReceiver(receiver) }
            }

            AmnionTheme {
                AmnionScreen(
                    viewModel = viewModel,
                    onConnect = {
                        val permission = VpnService.prepare(this)
                        if (permission == null) AmnionVpnService.start(this)
                        else permissionLauncher.launch(permission)
                    },
                    onDisconnect = { AmnionVpnService.stop(this) }
                )
            }
        }
    }
}

@Composable
private fun AmnionTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = androidx.compose.material3.darkColorScheme(
            primary = Purple,
            secondary = Cyan,
            background = Night,
            surface = Panel,
            onPrimary = Color.White,
            onBackground = White,
            onSurface = White,
            onSurfaceVariant = Muted
        ),
        content = content
    )
}

@Composable
private fun AmnionScreen(viewModel: MainViewModel, onConnect: () -> Unit, onDisconnect: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = Night, contentColor = White) {
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.verticalGradient(listOf(Color(0xFF0A1727), Color(0xFF0B1122), Night))
            )
        ) {
            Box(
                Modifier.size(300.dp).align(Alignment.TopEnd).graphicsLayer {
                    translationX = 135f
                    translationY = -145f
                }.background(
                    Brush.radialGradient(listOf(Purple.copy(alpha = .28f), Color.Transparent)),
                    CircleShape
                )
            )
            Box(
                Modifier.size(220.dp).align(Alignment.CenterStart).graphicsLayer { translationX = -135f }
                    .background(Brush.radialGradient(listOf(Cyan.copy(alpha = .10f), Color.Transparent)), CircleShape)
            )
            Column(
                Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()
                    .verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 18.dp)
            ) {
                BrandHeader()
                Spacer(Modifier.height(27.dp))
                AnimatedContent(targetState = viewModel.profile != null, label = "profile") { hasProfile ->
                    if (hasProfile) ConnectedHome(viewModel, onConnect, onDisconnect) else SetupCard(viewModel)
                }
            }
        }
    }
}

@Composable
private fun BrandHeader() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier.size(47.dp).clip(RoundedCornerShape(15.dp))
                .background(Brush.linearGradient(listOf(Purple, Cyan))),
            contentAlignment = Alignment.Center
        ) { Text("A", color = Color.White, fontWeight = FontWeight.Black, fontSize = 24.sp) }
        Spacer(Modifier.width(13.dp))
        Column {
            Text("AMNION", color = White, fontWeight = FontWeight.Black, fontSize = 21.sp, letterSpacing = 2.sp)
            Text("Private network", color = Muted, fontSize = 12.sp)
        }
        Spacer(Modifier.weight(1f))
        Surface(color = Mint.copy(alpha = .13f), shape = RoundedCornerShape(20.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp)
            ) {
                Box(Modifier.size(6.dp).background(Mint, CircleShape))
                Spacer(Modifier.width(6.dp))
                Text("SECURE", color = Mint, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun SetupCard(viewModel: MainViewModel) {
    Column {
        Text("Jouw internet.\nJouw keuze.", color = White, fontSize = 38.sp, lineHeight = 42.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(10.dp))
        Text("Kies een locatie en het protocol dat bij jouw verbinding past.", color = Muted, lineHeight = 22.sp)
        Spacer(Modifier.height(25.dp))
        GlassCard {
            SectionLabel("1", "Kies een server")
            Spacer(Modifier.height(13.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Region.entries.forEach { region ->
                    RegionCard(region, viewModel.selectedRegion == region, Modifier.weight(1f)) {
                        viewModel.selectRegion(region)
                    }
                }
            }
            Spacer(Modifier.height(23.dp))
            SectionLabel("2", "Kies een protocol")
            Spacer(Modifier.height(12.dp))
            Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                VpnProtocol.entries.forEach { protocol ->
                    ProtocolCard(protocol, viewModel.selectedProtocol == protocol) {
                        viewModel.selectProtocol(protocol)
                    }
                }
            }
            Spacer(Modifier.height(23.dp))
            SectionLabel("3", "Maak jouw profiel")
            Spacer(Modifier.height(12.dp))
            AmnionInput(viewModel.displayName, viewModel::setName, "Jouw naam", "Bijvoorbeeld Vince")
            Spacer(Modifier.height(12.dp))
            AmnionInput(
                viewModel.accessCode,
                viewModel::updateAccessCode,
                "Toegangscode",
                "Ontvangen van de beheerder",
                password = true
            )
            ErrorMessage(viewModel.errorMessage)
            Spacer(Modifier.height(18.dp))
            Button(
                onClick = viewModel::provision,
                enabled = !viewModel.loading,
                modifier = Modifier.fillMaxWidth().height(55.dp),
                shape = RoundedCornerShape(17.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Purple)
            ) {
                if (viewModel.loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Profiel veilig aanmaken", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(17.dp))
        Text(
            "Je toegangscode wordt alleen voor registratie gebruikt en nooit op je telefoon bewaard.",
            color = Muted, textAlign = TextAlign.Center, fontSize = 12.sp, lineHeight = 17.sp,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)
        )
    }
}

@Composable
private fun ConnectedHome(viewModel: MainViewModel, onConnect: () -> Unit, onDisconnect: () -> Unit) {
    val profile = viewModel.profile ?: return
    val state = viewModel.connectionState
    val connected = state == ConnectionState.CONNECTED
    val connecting = state == ConnectionState.CONNECTING
    val protocol = VpnProtocol.fromId(profile.protocolId)
    val region = Region.entries.firstOrNull { it.id == profile.regionId }
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        StatusPill(state)
        Spacer(Modifier.height(15.dp))
        Text(
            when {
                connected -> "Je bent beschermd"
                connecting -> "Verbinding maken..."
                else -> "Klaar om te verbinden"
            },
            color = White, fontSize = 29.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(6.dp))
        Text(
            if (connected) "Je internet loopt veilig via ${profile.regionLabel}" else "Tik op de knop om je VPN te starten",
            color = Muted, textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(29.dp))
        ConnectOrb(state) { if (connected || connecting) onDisconnect() else onConnect() }
        Spacer(Modifier.height(28.dp))
        GlassCard {
            Text("ACTIEVE ROUTE", color = Muted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.4.sp)
            Spacer(Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                RegionBadge(region?.code ?: profile.regionId.uppercase(), large = true)
                Spacer(Modifier.width(13.dp))
                Column {
                    Text(profile.regionLabel, color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(region?.city ?: "Amnion-node", color = Muted, fontSize = 13.sp)
                }
                Spacer(Modifier.weight(1f))
                Box(Modifier.size(10.dp).background(if (connected) Mint else Muted.copy(alpha = .65f), CircleShape))
            }
            Spacer(Modifier.height(17.dp))
            Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = .07f)))
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DetailTile("PROTOCOL", protocol.shortLabel, Modifier.weight(1f))
                DetailTile("POORT", protocol.port.toString(), Modifier.weight(1f))
                DetailTile("PROFIEL", profile.displayName, Modifier.weight(1f))
            }
        }
        Spacer(Modifier.height(14.dp))
        GlassCard {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("VPN-protocol", color = White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text(if (connected || connecting) "Verbreek om te wisselen" else protocol.description, color = Muted, fontSize = 12.sp)
                }
                if (viewModel.loading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = Cyan)
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                VpnProtocol.entries.forEach { option ->
                    CompactProtocol(
                        option,
                        selected = option == protocol,
                        enabled = !connected && !connecting && !viewModel.loading,
                        modifier = Modifier.weight(1f)
                    ) { viewModel.changeProtocol(option) }
                }
            }
        }
        ErrorMessage(viewModel.errorMessage)
        Spacer(Modifier.height(9.dp))
        TextButton(onClick = {
            if (connected || connecting) onDisconnect()
            viewModel.forgetProfile()
        }) { Text("Ander profiel instellen", color = Muted) }
    }
}

@Composable
private fun StatusPill(state: ConnectionState) {
    val color = when (state) {
        ConnectionState.CONNECTED -> Mint
        ConnectionState.CONNECTING -> Cyan
        ConnectionState.ERROR -> Danger
        ConnectionState.DISCONNECTED -> Muted
    }
    val label = when (state) {
        ConnectionState.CONNECTED -> "BEVEILIGD"
        ConnectionState.CONNECTING -> "VERBINDEN"
        ConnectionState.ERROR -> "VERBINDING GESTOPT"
        ConnectionState.DISCONNECTED -> "NIET VERBONDEN"
    }
    Surface(color = color.copy(alpha = .12f), shape = RoundedCornerShape(30.dp)) {
        Row(Modifier.padding(horizontal = 13.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(7.dp).background(color, CircleShape))
            Spacer(Modifier.width(7.dp))
            Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}

@Composable
private fun ConnectOrb(state: ConnectionState, onClick: () -> Unit) {
    val transition = rememberInfiniteTransition(label = "pulse")
    val pulse by transition.animateFloat(
        initialValue = .55f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse), label = "pulse-alpha"
    )
    val color = when (state) {
        ConnectionState.CONNECTED -> Mint
        ConnectionState.CONNECTING -> Cyan
        ConnectionState.ERROR -> Danger
        ConnectionState.DISCONNECTED -> Purple
    }
    Box(Modifier.size(220.dp), contentAlignment = Alignment.Center) {
        Box(
            Modifier.fillMaxSize().alpha(if (state == ConnectionState.CONNECTING) pulse else .65f)
                .border(BorderStroke(1.dp, color.copy(alpha = .27f)), CircleShape)
        )
        Box(
            Modifier.size(181.dp).border(BorderStroke(2.dp, color.copy(alpha = .55f)), CircleShape)
                .background(Brush.radialGradient(listOf(color.copy(alpha = .22f), Panel)), CircleShape)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                PowerIcon(color, active = state == ConnectionState.CONNECTED, modifier = Modifier.size(48.dp))
                Spacer(Modifier.height(13.dp))
                Text(
                    when (state) {
                        ConnectionState.CONNECTED -> "VERBREKEN"
                        ConnectionState.CONNECTING -> "STOPPEN"
                        else -> "VERBINDEN"
                    },
                    color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp
                )
            }
        }
    }
}

@Composable
private fun PowerIcon(color: Color, active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = size.minDimension * .095f
        drawArc(
            color = color,
            startAngle = -48f,
            sweepAngle = 276f,
            useCenter = false,
            style = Stroke(stroke, cap = StrokeCap.Round)
        )
        drawLine(
            color = color,
            start = Offset(size.width / 2f, size.height * .06f),
            end = Offset(size.width / 2f, size.height * if (active) .48f else .43f),
            strokeWidth = stroke,
            cap = StrokeCap.Round
        )
    }
}

@Composable
private fun RegionCard(region: Region, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val border = if (selected) Purple else Color.White.copy(alpha = .08f)
    Column(
        modifier.clip(RoundedCornerShape(17.dp))
            .background(if (selected) Purple.copy(alpha = .14f) else Color.White.copy(alpha = .035f))
            .border(1.dp, border, RoundedCornerShape(17.dp)).clickable(onClick = onClick).padding(15.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RegionBadge(region.code)
            Spacer(Modifier.weight(1f))
            Box(Modifier.size(9.dp).background(if (selected) Mint else Muted.copy(alpha = .45f), CircleShape))
        }
        Spacer(Modifier.height(12.dp))
        Text(region.label, color = White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        Text(region.city, color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun RegionBadge(code: String, large: Boolean = false) {
    Box(
        Modifier.size(if (large) 48.dp else 36.dp).clip(RoundedCornerShape(if (large) 15.dp else 11.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF234C8D), Purple.copy(alpha = .8f)))),
        contentAlignment = Alignment.Center
    ) { Text(code, color = Color.White, fontWeight = FontWeight.Black, fontSize = if (large) 14.sp else 11.sp) }
}

@Composable
private fun ProtocolCard(protocol: VpnProtocol, selected: Boolean, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp))
            .background(if (selected) Purple.copy(alpha = .14f) else PanelLight.copy(alpha = .55f))
            .border(1.dp, if (selected) Purple else Color.White.copy(alpha = .07f), RoundedCornerShape(15.dp))
            .clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier.size(38.dp).background(if (selected) Purple.copy(alpha = .25f) else Color.White.copy(alpha = .06f), RoundedCornerShape(11.dp)),
            contentAlignment = Alignment.Center
        ) { Text(protocol.shortLabel, color = if (selected) Cyan else White, fontSize = 10.sp, fontWeight = FontWeight.Black) }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(protocol.label, color = White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(protocol.description, color = Muted, fontSize = 11.sp)
        }
        Box(
            Modifier.size(18.dp).border(1.5.dp, if (selected) Purple else Muted.copy(alpha = .6f), CircleShape),
            contentAlignment = Alignment.Center
        ) { if (selected) Box(Modifier.size(10.dp).background(Purple, CircleShape)) }
    }
}

@Composable
private fun CompactProtocol(protocol: VpnProtocol, selected: Boolean, enabled: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier.clip(RoundedCornerShape(12.dp))
            .background(if (selected) Purple.copy(alpha = .20f) else Color.White.copy(alpha = .035f))
            .border(1.dp, if (selected) Purple else Color.White.copy(alpha = .07f), RoundedCornerShape(12.dp))
            .alpha(if (enabled || selected) 1f else .5f)
            .clickable(enabled = enabled && !selected, onClick = onClick)
            .padding(vertical = 11.dp),
        contentAlignment = Alignment.Center
    ) { Text(protocol.shortLabel, color = if (selected) Cyan else White, fontSize = 10.sp, fontWeight = FontWeight.Bold) }
}

@Composable
private fun DetailTile(label: String, value: String, modifier: Modifier) {
    Column(modifier) {
        Text(label, color = Muted, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = .6.sp)
        Spacer(Modifier.height(4.dp))
        Text(value, color = White, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1)
    }
}

@Composable
private fun SectionLabel(number: String, title: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(23.dp).background(Purple.copy(alpha = .20f), CircleShape), contentAlignment = Alignment.Center) {
            Text(number, color = Cyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.width(9.dp))
        Text(title, color = White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
    }
}

@Composable
private fun ErrorMessage(message: String?) {
    message?.let {
        Spacer(Modifier.height(13.dp))
        Surface(color = Danger.copy(alpha = .10f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
            Text(it, color = Danger, fontSize = 12.sp, lineHeight = 17.sp, modifier = Modifier.padding(12.dp))
        }
    }
}

@Composable
private fun AmnionInput(value: String, onValueChange: (String) -> Unit, label: String, placeholder: String, password: Boolean = false) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(placeholder, color = Muted.copy(alpha = .65f)) },
        visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Purple,
            unfocusedBorderColor = Color.White.copy(alpha = .12f),
            focusedLabelColor = Cyan,
            unfocusedLabelColor = Muted,
            focusedTextColor = White,
            unfocusedTextColor = White,
            cursorColor = Cyan
        )
    )
}

@Composable
private fun GlassCard(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
            .background(Panel.copy(alpha = .92f))
            .border(1.dp, Color.White.copy(alpha = .085f), RoundedCornerShape(24.dp))
            .padding(19.dp),
        content = content
    )
}
