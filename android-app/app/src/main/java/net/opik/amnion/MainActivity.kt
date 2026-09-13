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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import net.opik.amnion.data.ConnectionState
import net.opik.amnion.data.Region
import net.opik.amnion.vpn.AmnionVpnService

private val Night = Color(0xFF07101D)
private val Panel = Color(0xFF111D30)
private val Purple = Color(0xFF7657FF)
private val Cyan = Color(0xFF36CFF2)
private val Mint = Color(0xFF42E4A6)
private val Muted = Color(0xFF91A0B7)
private val Danger = Color(0xFFFF7185)

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
        colorScheme = MaterialTheme.colorScheme.copy(
            primary = Purple,
            secondary = Cyan,
            background = Night,
            surface = Panel,
            onPrimary = Color.White,
            onBackground = Color.White,
            onSurface = Color.White
        ),
        content = content
    )
}

@Composable
private fun AmnionScreen(
    viewModel: MainViewModel,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color(0xFF081421), Color(0xFF0B1022), Color(0xFF07101D)))
        )
    ) {
        Box(
            Modifier.size(280.dp).align(Alignment.TopEnd).graphicsLayer {
                translationX = 130f
                translationY = -130f
            }.background(Brush.radialGradient(listOf(Purple.copy(alpha = .24f), Color.Transparent)), CircleShape)
        )
        Column(
            Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()
                .verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 18.dp)
        ) {
            BrandHeader()
            Spacer(Modifier.height(28.dp))
            AnimatedContent(targetState = viewModel.profile != null, label = "profile") { hasProfile ->
                if (hasProfile) {
                    ConnectedHome(viewModel, onConnect, onDisconnect)
                } else {
                    SetupCard(viewModel)
                }
            }
        }
    }
}

@Composable
private fun BrandHeader() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier.size(46.dp).clip(RoundedCornerShape(15.dp))
                .background(Brush.linearGradient(listOf(Purple, Cyan))),
            contentAlignment = Alignment.Center
        ) { Text("A", color = Color.White, fontWeight = FontWeight.Black, fontSize = 24.sp) }
        Spacer(Modifier.width(13.dp))
        Column {
            Text("AMNION", fontWeight = FontWeight.Black, fontSize = 21.sp, letterSpacing = 2.sp)
            Text("Private network", color = Muted, fontSize = 12.sp)
        }
        Spacer(Modifier.weight(1f))
        Surface(color = Mint.copy(alpha = .12f), shape = RoundedCornerShape(20.dp)) {
            Text("SECURE", color = Mint, fontWeight = FontWeight.Bold, fontSize = 11.sp,
                modifier = Modifier.padding(horizontal = 11.dp, vertical = 7.dp))
        }
    }
}

@Composable
private fun SetupCard(viewModel: MainViewModel) {
    Column {
        Text("Jouw internet.\nJouw keuze.", fontSize = 39.sp, lineHeight = 43.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(10.dp))
        Text("Kies je locatie en maak in enkele seconden een persoonlijk VPN-profiel.", color = Muted, lineHeight = 22.sp)
        Spacer(Modifier.height(28.dp))
        GlassCard {
            Text("1  Kies een server", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(13.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Region.entries.forEach { region ->
                    RegionCard(region, viewModel.selectedRegion == region, Modifier.weight(1f)) {
                        viewModel.selectRegion(region)
                    }
                }
            }
            Spacer(Modifier.height(23.dp))
            Text("2  Maak jouw profiel", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(12.dp))
            AmnionInput(
                value = viewModel.displayName,
                onValueChange = viewModel::setName,
                label = "Jouw naam",
                placeholder = "Bijvoorbeeld Vince"
            )
            Spacer(Modifier.height(12.dp))
            AmnionInput(
                value = viewModel.accessCode,
                onValueChange = viewModel::updateAccessCode,
                label = "Toegangscode",
                placeholder = "Ontvangen van de beheerder",
                password = true
            )
            viewModel.errorMessage?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = Danger, fontSize = 13.sp)
            }
            Spacer(Modifier.height(18.dp))
            Button(
                onClick = viewModel::provision,
                enabled = !viewModel.loading,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(17.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Purple)
            ) {
                if (viewModel.loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Profiel veilig aanmaken", fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(18.dp))
        Text("Je toegangscode wordt alleen gebruikt voor registratie en niet op je telefoon bewaard.",
            color = Muted, textAlign = TextAlign.Center, fontSize = 12.sp, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun ConnectedHome(viewModel: MainViewModel, onConnect: () -> Unit, onDisconnect: () -> Unit) {
    val profile = viewModel.profile ?: return
    val connected = viewModel.connectionState == ConnectionState.CONNECTED
    val connecting = viewModel.connectionState == ConnectionState.CONNECTING
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text(
            when {
                connected -> "Je bent beschermd"
                connecting -> "Veilige verbinding maken"
                else -> "Klaar om te verbinden"
            },
            fontSize = 28.sp,
            fontWeight = FontWeight.Black
        )
        Spacer(Modifier.height(7.dp))
        Text(if (connected) "Al je internetverkeer loopt via Amnion" else "Tik op de knop om je VPN te starten", color = Muted)
        Spacer(Modifier.height(42.dp))
        ConnectOrb(viewModel.connectionState) {
            if (connected || connecting) onDisconnect() else onConnect()
        }
        Spacer(Modifier.height(38.dp))
        GlassCard {
            Text("VERBONDEN MET", color = Muted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.4.sp)
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (profile.regionId == "nl") "🇳🇱" else "🇩🇪", fontSize = 29.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(profile.regionLabel, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    Text("Profiel van ${profile.displayName}", color = Muted, fontSize = 13.sp)
                }
                Spacer(Modifier.weight(1f))
                Box(Modifier.size(9.dp).background(if (connected) Mint else Muted, CircleShape))
            }
        }
        viewModel.errorMessage?.let {
            Spacer(Modifier.height(14.dp))
            Text(it, color = Danger, fontSize = 13.sp, textAlign = TextAlign.Center)
        }
        Spacer(Modifier.height(18.dp))
        TextButton(onClick = {
            if (connected || connecting) onDisconnect()
            viewModel.forgetProfile()
        }) { Text("Ander profiel instellen", color = Muted) }
    }
}

@Composable
private fun ConnectOrb(state: ConnectionState, onClick: () -> Unit) {
    val transition = rememberInfiniteTransition(label = "pulse")
    val pulse by transition.animateFloat(
        initialValue = .75f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1100), RepeatMode.Reverse), label = "pulse-alpha"
    )
    val color = when (state) {
        ConnectionState.CONNECTED -> Mint
        ConnectionState.CONNECTING -> Cyan
        ConnectionState.ERROR -> Danger
        ConnectionState.DISCONNECTED -> Purple
    }
    Box(Modifier.size(224.dp), contentAlignment = Alignment.Center) {
        Box(Modifier.fillMaxSize().alpha(if (state == ConnectionState.CONNECTING) pulse else .7f)
            .border(BorderStroke(1.dp, color.copy(alpha = .25f)), CircleShape))
        Box(Modifier.size(184.dp).border(BorderStroke(2.dp, color.copy(alpha = .45f)), CircleShape)
            .background(Brush.radialGradient(listOf(color.copy(alpha = .18f), Panel)), CircleShape)
            .clickable(onClick = onClick), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(if (state == ConnectionState.CONNECTED) "✓" else "⏻", color = color, fontSize = 49.sp, fontWeight = FontWeight.Light)
                Spacer(Modifier.height(5.dp))
                Text(
                    when (state) {
                        ConnectionState.CONNECTED -> "VERBREKEN"
                        ConnectionState.CONNECTING -> "STOPPEN"
                        else -> "VERBINDEN"
                    }, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp
                )
            }
        }
    }
}

@Composable
private fun RegionCard(region: Region, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val border = if (selected) Purple else Color.White.copy(alpha = .08f)
    Column(
        modifier.clip(RoundedCornerShape(17.dp)).background(if (selected) Purple.copy(alpha = .13f) else Color.White.copy(alpha = .035f))
            .border(1.dp, border, RoundedCornerShape(17.dp)).clickable(onClick = onClick).padding(15.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(region.flag, fontSize = 25.sp)
            Spacer(Modifier.weight(1f))
            Box(Modifier.size(9.dp).background(if (selected) Mint else Muted.copy(alpha = .5f), CircleShape))
        }
        Spacer(Modifier.height(12.dp))
        Text(region.label, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        Text(region.city, color = Muted, fontSize = 12.sp)
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
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            cursorColor = Cyan
        )
    )
}

@Composable
private fun GlassCard(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp))
            .background(Panel.copy(alpha = .88f)).border(1.dp, Color.White.copy(alpha = .08f), RoundedCornerShape(24.dp))
            .padding(19.dp),
        content = content
    )
}
