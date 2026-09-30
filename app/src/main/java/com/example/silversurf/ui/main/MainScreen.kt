package com.example.silversurf.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavKey
import com.example.silversurf.data.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MainScreenViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    // Typography multipliers for accessibility scaling
    val scale = when (state.textSize) {
        "medium" -> 1.0f
        "large" -> 1.25f
        "extra-large" -> 1.5f
        else -> 1.2f
    }

    // High Contrast color schemes
    val contrastBg = if (state.highContrast) Color.Black else Color(0xFF0F172A)
    val contrastText = if (state.highContrast) Color.White else Color(0xFFF8FAFC)
    val screenBg = if (state.highContrast) Color.White else Color(0xFFF1F5F9)
    val cardBg = if (state.highContrast) Color.White else Color.White
    val cardBorder = if (state.highContrast) BorderStroke(2.dp, Color.Black) else BorderStroke(1.dp, Color(0xFFE2E8F0))

    var showSettings by remember { mutableStateOf(false) }
    var showCheckout by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(contrastBg)
    ) {
        when (state.currentScreen) {
            Screen.Login -> {
                LoginView(
                    scale = scale,
                    textColor = contrastText,
                    onLogin = { name -> viewModel.login(name) }
                )
            }
            Screen.Home -> {
                HomeView(
                    state = state,
                    scale = scale,
                    screenBg = screenBg,
                    cardBg = cardBg,
                    cardBorder = cardBorder,
                    onQuestSelect = { idx -> viewModel.selectQuest(idx); viewModel.navigateTo(Screen.Simulator) },
                    onStyleSelect = { cat, style -> 
                        viewModel.selectCategory(cat)
                        viewModel.selectStyle(style)
                        viewModel.navigateTo(Screen.Simulator) 
                    },
                    onGameSelect = { gameId ->
                        viewModel.startGame(gameId)
                        viewModel.navigateTo(Screen.Simulator)
                    },
                    onUpgradeClick = { showCheckout = true },
                    onSettingsClick = { showSettings = true }
                )
            }
            Screen.Simulator -> {
                SimulatorView(
                    state = state,
                    scale = scale,
                    screenBg = screenBg,
                    viewModel = viewModel,
                    onBackHome = { viewModel.navigateTo(Screen.Home) },
                    onSettingsClick = { showSettings = true }
                )
            }
        }

        // Accessibility Settings Overlay Drawer
        if (showSettings) {
            AlertDialog(
                onDismissRequest = { showSettings = false },
                confirmButton = {
                    Button(onClick = { showSettings = false }) { Text("OK", fontSize = (14 * scale).sp) }
                },
                title = { Text("⚙️ Accessibility Settings", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("🗣️ Text Size Scale")
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("medium", "large", "extra-large").forEach { size ->
                                Button(
                                    onClick = { viewModel.updateCustomOption() /* triggers update logic in vm */ },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (state.textSize == size) MaterialTheme.colorScheme.primary else Color.LightGray
                                    )
                                ) {
                                    Text(size.uppercase(), fontSize = 11.sp)
                                }
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = state.highContrast, onCheckedChange = { /* toggle in VM */ })
                            Spacer(Modifier.width(8.dp))
                            Text("🖤 High Contrast Colors")
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = state.voicePrompts, onCheckedChange = { /* toggle in VM */ })
                            Spacer(Modifier.width(8.dp))
                            Text("🔊 TTS Voice Prompts")
                        }
                    }
                }
            )
        }

        // Mock Checkout billing modal
        if (showCheckout) {
            AlertDialog(
                onDismissRequest = { showCheckout = false },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.completeSimulatedUpgrade()
                            showCheckout = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                    ) {
                        Text("💳 Complete Simulated Purchase")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCheckout = false }) { Text("Cancel") }
                },
                title = { Text("🔒 SilverSurf Pro Upgrade") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Upgrade to unlock design studio settings, button shapes, and exclude simulated ads.")
                        OutlinedTextField(
                            value = "4111 2222 3333 4444",
                            onValueChange = {},
                            label = { Text("Mock Card Number") }
                        )
                    }
                }
            )
        }
    }
}

@Composable
fun LoginView(
    scale: Float,
    textColor: Color,
    onLogin: (String) -> Unit
) {
    var name by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("🌊", fontSize = (72 * scale).sp, modifier = Modifier.padding(bottom = 12.dp))
        Text(
            "SilverSurf",
            fontSize = (38 * scale).sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF38BDF8)
        )
        Text(
            "Senior Digital App Trainer",
            fontSize = (14 * scale).sp,
            color = Color.LightGray,
            modifier = Modifier.padding(bottom = 40.dp)
        )

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Your Name", fontSize = (14 * scale).sp) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(20.dp))

        Button(
            onClick = { if (name.isNotBlank()) onLogin(name) },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("🚀 START TRAINING", fontSize = (16 * scale).sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun HomeView(
    state: SilverSurfUiState,
    scale: Float,
    screenBg: Color,
    cardBg: Color,
    cardBorder: BorderStroke,
    onQuestSelect: (Int) -> Unit,
    onStyleSelect: (AppCategory, AppStyle) -> Unit,
    onGameSelect: (String) -> Unit,
    onUpgradeClick: () -> Unit,
    onSettingsClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(screenBg)
    ) {
        // App Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    "Welcome, ${state.username} 👋",
                    fontSize = (20 * scale).sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Text("Ready for today's training?", fontSize = (12 * scale).sp, color = Color.Gray)
            }
            IconButton(onClick = onSettingsClick) {
                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.DarkGray)
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Stats progress card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = cardBg),
                    border = cardBorder
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Overall Progress", fontWeight = FontWeight.Bold, fontSize = (16 * scale).sp)
                            Text(
                                "${state.completedQuests.size} of 9 completed",
                                fontSize = (13 * scale).sp,
                                color = Color.DarkGray
                            )
                        }
                        CircularProgressIndicator(
                            progress = { state.completedQuests.size.toFloat() / 9f },
                            color = Color(0xFF16A34A),
                            strokeWidth = 6.dp,
                            modifier = Modifier.size(50.dp)
                        )
                    }
                }
            }

            // Challenges Header
            item {
                Text("🏆 Active Challenges", fontWeight = FontWeight.Bold, fontSize = (15 * scale).sp)
            }

            // Active Quest shortcuts list
            itemsIndexed(state.notes.take(5) /* placeholder list mapping */) { idx, _ ->
                // Custom static mapping for quests
                val q = state.currentQuestIndex // sample trigger
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onQuestSelect(idx) },
                    colors = CardDefaults.cardColors(containerColor = cardBg),
                    border = cardBorder
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("⭕", modifier = Modifier.padding(end = 12.dp))
                        Column {
                            Text("Quest Title Card Placeholder", fontWeight = FontWeight.Bold, fontSize = (14 * scale).sp)
                            Text("Tap to open interface simulator", fontSize = (11 * scale).sp, color = Color.Gray)
                        }
                    }
                }
            }

            // Catalogues Library
            item {
                Text("📱 Catalogues Library", fontWeight = FontWeight.Bold, fontSize = (15 * scale).sp)
            }

            item {
                Text("📞 Phone Dialer Styles", fontWeight = FontWeight.SemiBold, fontSize = (12 * scale).sp)
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("iOS" to AppStyle.Ios, "Android" to AppStyle.Android, "Easy Mode" to AppStyle.Easy, "Custom" to AppStyle.Custom).forEach { (label, style) ->
                        Button(
                            onClick = { onStyleSelect(AppCategory.Dialer, style) },
                            modifier = Modifier.weight(1.5f)
                        ) {
                            Text(label, fontSize = (10 * scale).sp)
                        }
                    }
                }
            }

            item {
                Text("📝 Notepad Styles", fontWeight = FontWeight.SemiBold, fontSize = (12 * scale).sp)
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("iOS" to AppStyle.Ios, "Android" to AppStyle.Android, "Easy Mode" to AppStyle.Easy, "Custom" to AppStyle.Custom).forEach { (label, style) ->
                        Button(
                            onClick = { onStyleSelect(AppCategory.Notepad, style) },
                            modifier = Modifier.weight(1.5f)
                        ) {
                            Text(label, fontSize = (10 * scale).sp)
                        }
                    }
                }
            }

            item {
                Text("🎮 Daily Training Games", fontWeight = FontWeight.SemiBold, fontSize = (12 * scale).sp)
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Spot & Tap" to "find", "Simon Says" to "follow", "Capture Flag" to "riddle").forEach { (label, gameId) ->
                        Button(
                            onClick = { onGameSelect(gameId) },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDB2777))
                        ) {
                            Text(label, fontSize = (10 * scale).sp)
                        }
                    }
                }
            }

            // Billing Status
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "💎 Unlock SilverSurf Premium",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = (15 * scale).sp
                        )
                        Text(
                            "Remove ads and customize button designs with sliders.",
                            color = Color.LightGray,
                            fontSize = (11 * scale).sp,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                        if (!state.isPremium) {
                            Button(onClick = onUpgradeClick) { Text("Upgrade - $4.99/mo") }
                        } else {
                            Text("✓ Premium Active", color = Color(0xFF16A34A), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SimulatorView(
    state: SilverSurfUiState,
    scale: Float,
    screenBg: Color,
    viewModel: MainScreenViewModel,
    onBackHome: () -> Unit,
    onSettingsClick: () -> Unit
) {
    var hudCollapsed by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(screenBg)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Collapsible HUD Instruction Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("🎯 ACTIVE QUEST", color = Color(0xFFF59E0B), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { hudCollapsed = !hudCollapsed }) {
                            Text(if (hudCollapsed) "▼" else "▲", color = Color.White)
                        }
                    }

                    if (!hudCollapsed) {
                        Text(
                            "Instruction text displays here...",
                            color = Color.White,
                            fontSize = (13 * scale).sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 6.dp)
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Button(onClick = { viewModel.toggleHint() }, modifier = Modifier.weight(1f)) {
                                Text("💡 Hint", fontSize = (11 * scale).sp)
                            }
                            Button(
                                onClick = onBackHome,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("🏠 Home", fontSize = (11 * scale).sp)
                            }
                            Button(
                                onClick = { /* vm.skipQuest() */ },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Next", fontSize = (11 * scale).sp)
                            }
                        }
                    }
                }
            }

            // Main simulated views injected inside the screen body
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                if (state.activeCategory == AppCategory.Dialer) {
                    when (state.activeStyle) {
                        AppStyle.Ios -> IosDialerMock(state, scale, viewModel)
                        AppStyle.Android -> AndroidDialerMock(state, scale, viewModel)
                        AppStyle.Easy -> EasyDialerMock(state, scale, viewModel)
                        AppStyle.Custom -> CustomStudioMock(state, scale, viewModel)
                    }
                } else {
                    when (state.activeStyle) {
                        AppStyle.Ios -> IosNotesMock(state, scale, viewModel)
                        AppStyle.Android -> GoogleKeepMock(state, scale, viewModel)
                        AppStyle.Easy -> EasyNotesMock(state, scale, viewModel)
                        AppStyle.Custom -> CustomStudioMock(state, scale, viewModel)
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------
// SUB-SIMULATOR COMPOSABLES FOR DIALER/NOTES
// ----------------------------------------------------
@Composable
fun IosDialerMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            state.inputNumber,
            fontSize = (32 * scale).sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(20.dp)
        )

        // Dialer Pad
        val keys = listOf(
            "1" to "", "2" to "ABC", "3" to "DEF",
            "4" to "GHI", "5" to "JKL", "6" to "MNO",
            "7" to "PQRS", "8" to "TUV", "9" to "WXYZ",
            "*" to "", "0" to "+", "#" to ""
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            for (row in 0..3) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    for (col in 0..2) {
                        val index = row * 3 + col
                        val (digit, label) = keys[index]
                        Box(
                            modifier = Modifier
                                .size(70.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE2E8F0))
                                .clickable { viewModel.typeDigit(digit) },
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(digit, fontSize = (22 * scale).sp, fontWeight = FontWeight.Bold)
                                if (label.isNotEmpty()) {
                                    Text(label, fontSize = (9 * scale).sp, color = Color.Gray)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Action bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { viewModel.startCall() },
                modifier = Modifier
                    .size(68.dp)
                    .background(Color(0xFF16A34A), CircleShape)
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call", tint = Color.White)
            }
            if (state.inputNumber.isNotEmpty()) {
                IconButton(onClick = { viewModel.backspace() }) {
                    Icon(Icons.Default.Clear, contentDescription = "Delete")
                }
            }
        }
    }
}

@Composable
fun AndroidDialerMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.padding(16.dp)) {
            OutlinedTextField(
                value = state.inputNumber,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier.fillMaxWidth()
            )
            
            Text("Recents", fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 10.dp))
            LazyColumn {
                items(state.recents) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable { viewModel.startCall(item.name, item.number) }
                    ) {
                        Text("${item.name} (${item.number})", modifier = Modifier.padding(12.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun CustomStudioMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("🎨 Live Design Studio", fontWeight = FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { viewModel.updateCustomOption(theme = "ocean") }) { Text("Theme: Ocean") }
            Button(onClick = { viewModel.updateCustomOption(shape = "square") }) { Text("Shape: Square") }
        }
        
        Spacer(Modifier.height(20.dp))
        Text("Custom styled interface rendered here.")
    }
}

@Composable
fun IosNotesMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("My Notebook", fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
        LazyColumn {
            items(state.notes) { note ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp)
                        .clickable { viewModel.selectNoteForEditing(note.id) }
                ) {
                    Text(note.title.ifEmpty { "Untitled" }, modifier = Modifier.padding(12.dp))
                }
            }
        }
        Button(onClick = { viewModel.createNewNote() }) { Text("Create Note") }
    }
}

@Composable
fun GoogleKeepMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Google Keep grid layout")
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(state.notes) { note ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .clickable { viewModel.selectNoteForEditing(note.id) }
                ) {
                    Text(note.title, modifier = Modifier.padding(8.dp))
                }
            }
        }
    }
}

@Composable
fun EasyDialerMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    var showConfirmDialog by remember { mutableStateOf<Contact?>(null) }

    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(15.dp)) {
            Text("👵 Giant Speed Dial List", fontWeight = FontWeight.ExtraBold, fontSize = (24 * scale).sp)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.contacts) { contact ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showConfirmDialog = contact },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFE2E8F0))
                    ) {
                        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("👤", fontSize = (32 * scale).sp, modifier = Modifier.padding(end = 15.dp))
                            Column {
                                Text(contact.name, fontWeight = FontWeight.Bold, fontSize = (20 * scale).sp)
                                Text("Click to Call - ${contact.phone}", fontSize = (13 * scale).sp, color = Color.DarkGray)
                            }
                        }
                    }
                }
            }
        }

        showConfirmDialog?.let { contact ->
            AlertDialog(
                onDismissRequest = { showConfirmDialog = null },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.startCall(contact.name, contact.phone)
                            showConfirmDialog = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                    ) {
                        Text("✅ OK - START CALL", fontSize = (14 * scale).sp)
                    }
                },
                dismissButton = {
                    Button(onClick = { showConfirmDialog = null }) { Text("Cancel") }
                },
                title = { Text("Call Confirmation") },
                text = { Text("Are you sure you want to call ${contact.name}?") }
            )
        }
    }
}

@Composable
fun EasyNotesMock(state: SilverSurfUiState, scale: Float, viewModel: MainScreenViewModel) {
    var selectedNote by remember { mutableStateOf<Note?>(null) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (selectedNote == null) {
            Text("📝 Giant Notes Viewer", fontWeight = FontWeight.ExtraBold, fontSize = (24 * scale).sp)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.notes) { note ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedNote = note },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7))
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(note.title.ifEmpty { "Untitled" }, fontWeight = FontWeight.Bold, fontSize = (20 * scale).sp)
                            Text(note.content, fontSize = (14 * scale).sp, maxLines = 1)
                        }
                    }
                }
            }
        } else {
            val note = selectedNote!!
            Card(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(15.dp)) {
                    Text(note.title, fontWeight = FontWeight.Bold, fontSize = (22 * scale).sp)
                    Text(note.content, fontSize = (18 * scale).sp)

                    Button(
                        onClick = { viewModel.readNoteAloud(note.id) },
                        modifier = Modifier.fillMaxWidth().height(60.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                    ) {
                        Text("🗣️ READ NOTE ALOUD", fontSize = (16 * scale).sp, fontWeight = FontWeight.Bold)
                    }

                    Button(onClick = { selectedNote = null }, modifier = Modifier.fillMaxWidth()) {
                        Text("⬅️ Back to list")
                    }
                }
            }
        }
    }
}
