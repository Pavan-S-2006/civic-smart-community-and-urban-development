package com.example.silversurf.ui.main

import android.app.Application
import android.speech.tts.TextToSpeech
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.silversurf.data.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.random.Random

class MainScreenViewModel(application: Application) : AndroidViewModel(application), TextToSpeech.OnInitListener {

    private val _uiState = MutableStateFlow(SilverSurfUiState())
    val uiState: StateFlow<SilverSurfUiState> = _uiState.asStateFlow()

    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var callTimerJob: Job? = null
    private var simonFlashJob: Job? = null

    // Quests Database
    val quests = listOf(
        Quest("explore", "🔍 Free Style: Explore Buttons", "Touch any button to explore how mobile layouts respond.", "Try tapping at least 3 buttons inside the phone screen to get familiar.", "any", "click", "", "Tap any button to progress."),
        Quest("ios_dial", "📞 iOS: Dial Sarah's Number", "Practice typing a saved contact's number on Apple's standard keypad.", "Switch to iOS Style Dialer. Type Sarah's number: 555-0199 and click the green CALL button.", "ios", "click", ".call-btn", "Sarah's number is 5 5 5 0 1 9 9. Tap the keys in order, then click call."),
        Quest("android_fab", "🤖 Android: Call Son from Recents", "Android layout has a starred screen. Locate history to call back.", "Switch to Android Style Dialer. Go to Recents tab, click the contact named 'Son (Michael)' to call him back.", "android", "click", ".recent-row", "Click Recents in the tab bar, then click Son (Michael)'s name card."),
        Quest("easy_speeddial", "👴 Easy Mode: Call Dr. Smith", "Easy Mode has huge buttons. Save time with speed dial.", "Switch to Android, then tap the Easy Style button. Click the Dr. Smith Speed Dial button, then click Green OK to call.", "android", "click", "#easy-confirm-ok-btn", "Tap the giant card for Dr. Smith, then confirm by clicking OK."),
        Quest("ios_note_compose", "📝 iOS Notes: Save Medical Note", "Create a folder note to write down info.", "Switch to Notepad Category under iOS Style. Click the compose note button, type 'Dr appointment monday' and click DONE.", "ios", "input", "#custom-new-note-btn", "Click the compose box in the bottom right corner, write content, then save."),
        Quest("keep_change_color", "🎨 Google Keep: Note Color", "Change note background color to organize them visually.", "Switch to Notepad Category under Android Style. Click the 'Shopping List' card, tap palette (🎨) and select Yellow.", "android", "click", "yellow", "Tap the note card. Click the paint palette at the bottom, then click yellow."),
        Quest("easy_read_note", "🔊 Easy Notes: Read Aloud", "Read your notes out loud so you don't have to strain your eyes.", "Switch to Notepad Category, click Easy Mode. Tap the 'Doctor Appointment' note, then click READ NOTE ALOUD.", "android", "click", "#easy-note-speech-btn", "Tap Doctor Appointment note card, then click the giant blue Speak button."),
        Quest("upgrade_premium", "💎 Premium: Upgrade Account", "Practice simulated secure billing checkout.", "Go to the Premium billing section on Home. Click Upgrade, type dummy details, and submit purchase.", "any", "click", "", "Select Home -> Upgrade, fill the forms, then click Complete Purchase."),
        Quest("play_game", "🎮 Games: Spot & Tap", "Whack-a-button touchscreen coordination game.", "Select Daily Games -> Spot & Tap. Tap the gold target button 5 times inside the screen.", "any", "game", "", "Start Spot & Tap. Tap the floating gold button wherever it appears.")
    )

    init {
        tts = TextToSpeech(application, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            ttsReady = true
            speak("Welcome to SilverSurf. Please log in by entering your name.")
        }
    }

    fun speak(text: String) {
        if (_uiState.value.voicePrompts && ttsReady) {
            tts?.setSpeechRate(_uiState.value.voiceSpeed)
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        }
    }

    // Navigation Screens
    fun navigateTo(screen: Screen) {
        _uiState.update { it.copy(currentScreen = screen) }
        if (screen == Screen.Home) {
            speak("Welcome back to Home. Pick a challenge to start training, or try a style from the library.")
        }
    }

    fun login(name: String) {
        _uiState.update { it.copy(username = name, currentScreen = Screen.Home) }
        speak("Hello $name! Your SilverSurf training dashboard is ready.")
    }

    // App Switcher
    fun selectCategory(category: AppCategory) {
        _uiState.update { it.copy(activeCategory = category, notesActiveView = "list", notesEditingId = null) }
        speak("Switched to ${if (category == AppCategory.Dialer) "Phone Dialer" else "Notepad app"}")
    }

    fun selectStyle(style: AppStyle) {
        _uiState.update { it.copy(activeStyle = style, inputNumber = "") }
        speak("Style set to ${when (style) {
            AppStyle.Ios -> "Apple iOS Style"
            AppStyle.Android -> "Android Style"
            AppStyle.Custom -> "Custom customizable style"
        }}")
    }

    fun updateCustomOption(theme: String? = null, shape: String? = null, size: Int? = null, spacing: Int? = null, border: Int? = null) {
        _uiState.update { state ->
            val prev = state.customOptions
            state.copy(
                customOptions = prev.copy(
                    theme = theme ?: prev.theme,
                    shape = shape ?: prev.shape,
                    buttonSize = size ?: prev.buttonSize,
                    spacing = spacing ?: prev.spacing,
                    borderWidth = border ?: prev.borderWidth
                )
            )
        }
    }

    // Dialer Interactions
    fun typeDigit(digit: String) {
        if (_uiState.value.activeGameMode == "follow") {
            handleFollowKeyPress(digit)
            return
        }

        _uiState.update { state ->
            if (state.inputNumber.length < 15) {
                state.copy(inputNumber = state.inputNumber + digit)
            } else state
        }
        speak(if (digit == "*") "Star" else if (digit == "#") "Hash" else digit)
        checkExploreTap()
    }

    fun backspace() {
        _uiState.update { state ->
            if (state.inputNumber.isNotEmpty()) {
                state.copy(inputNumber = state.inputNumber.dropLast(1))
            } else state
        }
        speak("Delete")
        checkExploreTap()
    }

    private fun checkExploreTap() {
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "explore") {
            _uiState.update { it.copy(exploreTapCount = it.exploreTapCount + 1) }
            if (_uiState.value.exploreTapCount >= 3) {
                completeQuest(currentQuest.id)
            }
        }
    }

    // Active Calls
    fun startCall(name: String? = null, phone: String? = null) {
        val dialName = name ?: formatNumberAsName(phone ?: _uiState.value.inputNumber)
        val dialPhone = phone ?: _uiState.value.inputNumber
        
        _uiState.update { state ->
            state.copy(activeCall = ActiveCall(dialName, dialPhone, 0))
        }
        
        speak("Calling $dialName. Screen changed to Call Window.")
        
        // Start call timer job
        callTimerJob?.cancel()
        callTimerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                _uiState.update { state ->
                    val active = state.activeCall
                    if (active != null) {
                        state.copy(activeCall = active.copy(seconds = active.seconds + 1))
                    } else state
                }
            }
        }

        // Validate Quest
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "ios_dial" && dialPhone == "5550199") {
            completeQuest(currentQuest.id)
        } else if (currentQuest.id == "android_fab" && dialName.contains("Michael")) {
            completeQuest(currentQuest.id)
        } else if (currentQuest.id == "easy_speeddial" && dialName.contains("Smith")) {
            completeQuest(currentQuest.id)
        }
    }

    fun endCall() {
        val call = _uiState.value.activeCall ?: return
        callTimerJob?.cancel()

        _uiState.update { state ->
            val updatedRecents = listOf(
                RecentCall(call.name, call.phone, "outgoing", "10:15 AM")
            ) + state.recents
            state.copy(activeCall = null, inputNumber = "", recents = updatedRecents)
        }
        speak("Call ended.")
    }

    private fun formatNumberAsName(num: String): String {
        val match = _uiState.value.contacts.find { it.phone == num }
        return match?.name ?: "Number $num"
    }

    // Notepad Interactions
    fun selectNoteForEditing(noteId: String) {
        _uiState.update { it.copy(notesEditingId = noteId, notesActiveView = "edit") }
        val note = _uiState.value.notes.find { it.id == noteId }
        if (note != null) {
            speak("Opened note card ${note.title}")
        }
    }

    fun createNewNote() {
        val newId = Random.nextInt(100000).toString()
        val newNote = Note(newId, "", "", "default", false, "10:30 AM")
        _uiState.update { state ->
            state.copy(
                notes = listOf(newNote) + state.notes,
                notesEditingId = newId,
                notesActiveView = "edit"
            )
        }
        speak("New empty note created. Editing.")
    }

    fun saveNote(title: String, content: String) {
        _uiState.update { state ->
            val updated = state.notes.map { note ->
                if (note.id == state.notesEditingId) {
                    note.copy(title = title, content = content)
                } else note
            }
            state.copy(notes = updated, notesEditingId = null, notesActiveView = "list")
        }
        speak("Note saved.")

        // Validate Quest
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "ios_note_compose") {
            completeQuest(currentQuest.id)
        }
    }

    fun deleteEditingNote() {
        val id = _uiState.value.notesEditingId ?: return
        _uiState.update { state ->
            val updated = state.notes.filterNot { it.id == id }
            state.copy(notes = updated, notesEditingId = null, notesActiveView = "list")
        }
        speak("Note card deleted.")
    }

    fun changeKeepNoteColor(color: String) {
        _uiState.update { state ->
            val updated = state.notes.map { note ->
                if (note.id == state.notesEditingId) note.copy(color = color) else note
            }
            state.copy(notes = updated)
        }
        speak("Note card background changed to $color")

        // Validate Quest
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "keep_change_color" && color == "yellow") {
            completeQuest(currentQuest.id)
        }
    }

    fun readNoteAloud(noteId: String) {
        val note = _uiState.value.notes.find { it.id == noteId } ?: return
        speak("Reading note out loud. Title: ${note.title}. Content: ${note.content}")

        // Validate Quest
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "easy_read_note") {
            completeQuest(currentQuest.id)
        }
    }

    // Premium Subscription Upgrade
    fun completeSimulatedUpgrade() {
        _uiState.update { it.copy(isPremium = true) }
        speak("Simulated checkout completed. Congratulations, you are now a Premium Member of SilverSurf!")

        // Validate Quest
        val currentQuest = quests[_uiState.value.currentQuestIndex]
        if (currentQuest.id == "upgrade_premium") {
            completeQuest(currentQuest.id)
        }
    }

    // Quest flow coordinates
    fun selectQuest(index: Int) {
        if (index in quests.indices) {
            _uiState.update { it.copy(currentQuestIndex = index, showActiveHint = false, exploreTapCount = 0) }
            val q = quests[index]
            speak("Challenge ${index + 1}: ${q.title}. Instructions: ${q.instruction}")
        }
    }

    fun completeQuest(questId: String) {
        if (_uiState.value.completedQuests[questId] == true) return
        _uiState.update { state ->
            val updated = state.completedQuests.toMutableMap()
            updated[questId] = true
            state.copy(completedQuests = updated)
        }
        speak("Excellent memory! You did it. Tap Next on the floating box to progress.")
    }

    fun toggleHint() {
        _uiState.update { it.copy(showActiveHint = !it.showActiveHint) }
        if (_uiState.value.showActiveHint) {
            val q = quests[_uiState.value.currentQuestIndex]
            speak(q.hint)
        }
    }

    // Daily Games Zone Controllers
    fun startGame(gameId: String) {
        _uiState.update { state ->
            state.copy(
                activeGameMode = gameId,
                gameFindClicks = 0,
                gameRiddleIndex = 0,
                gameRiddleFlags = 0
            )
        }

        if (gameId == "find") {
            speak("Whack-a-button started! Keep your eyes on the screen, find the floating gold target button, and tap it 5 times.")
            generateFindCoordinates()
        } else if (gameId == "follow") {
            speak("Simon Says sequence game started. Watch the numbers flash, then repeat them in order.")
            startSimonSequence()
        } else if (gameId == "riddle") {
            speak("Capture the Flag clues started. Listen to the riddle and click the correct button.")
            loadNextRiddle()
        }
    }

    // Whack-a-Button coordinates
    fun generateFindCoordinates() {
        val randX = Random.nextInt(40, 240)
        val randY = Random.nextInt(150, 480)
        _uiState.update { it.copy(exploreTapCount = randX, gameFindClicks = _uiState.value.gameFindClicks) } // reuse placeholders safely
    }

    fun clickFindTarget() {
        _uiState.update { it.copy(gameFindClicks = it.gameFindClicks + 1) }
        speak("Spot and tap success!")
        if (_uiState.value.gameFindClicks >= 5) {
            _uiState.update { it.copy(activeGameMode = null) }
            speak("Fantastic visual coordination! Whack-a-button complete.")
            completeQuest("play_game")
        } else {
            generateFindCoordinates()
        }
    }

    // Simon Says
    private fun startSimonSequence() {
        simonFlashJob?.cancel()
        simonFlashJob = viewModelScope.launch {
            val keys = listOf("1", "3", "5") // 3 steps sequence
            _uiState.update { it.copy(gameFollowPattern = keys, gameFollowIsFlashing = true, gameFollowUserIndex = 0) }
            
            for (key in keys) {
                speak("Key $key flashes.")
                delay(800)
            }
            _uiState.update { it.copy(gameFollowIsFlashing = false) }
            speak("Your turn. Repeat the sequence.")
        }
    }

    private fun handleFollowKeyPress(digit: String) {
        val stateVal = _uiState.value
        if (stateVal.gameFollowIsFlashing) return

        val target = stateVal.gameFollowPattern.getOrNull(stateVal.gameFollowUserIndex)
        if (digit == target) {
            val nextIdx = stateVal.gameFollowUserIndex + 1
            _uiState.update { it.copy(gameFollowUserIndex = nextIdx) }
            speak("Correct button.")
            if (nextIdx >= stateVal.gameFollowPattern.size) {
                _uiState.update { it.copy(activeGameMode = null) }
                speak("Terrific memory! Challenge completed!")
            }
        } else {
            speak("Incorrect digit. Watch again.")
            startSimonSequence()
        }
    }

    // Capture the Flag Riddles
    private val riddles = listOf(
        "Find the button that is circular, green, and starts a call." to "call",
        "Find the back arrow button next to call that deletes letters." to "backspace"
    )

    private fun loadNextRiddle() {
        val idx = _uiState.value.gameRiddleIndex
        if (idx >= riddles.size) {
            _uiState.update { it.copy(activeGameMode = null) }
            speak("Outstanding riddle solver! All flags captured.")
            return
        }
        val text = riddles[idx].first
        speak("Clue: $text")
    }

    fun submitRiddleTouch(elementId: String) {
        val stateVal = _uiState.value
        if (stateVal.activeGameMode != "riddle") return

        val target = riddles.getOrNull(stateVal.gameRiddleIndex)?.second
        if (elementId == target) {
            val nextIdx = stateVal.gameRiddleIndex + 1
            _uiState.update { it.copy(gameRiddleIndex = nextIdx, gameRiddleFlags = stateVal.gameRiddleFlags + 1) }
            speak("Correct! Flag captured.")
            if (nextIdx < riddles.size) {
                loadNextRiddle()
            } else {
                _uiState.update { it.copy(activeGameMode = null) }
                speak("Terrific job! You completed all riddle flag challenges.")
            }
        } else {
            speak("That's not the right button. Try again.")
        }
    }

    override fun onCleared() {
        tts?.shutdown()
        callTimerJob?.cancel()
        simonFlashJob?.cancel()
        super.onCleared()
    }
}

data class SilverSurfUiState(
    val currentScreen: Screen = Screen.Login,
    val username: String = "",
    val activeCategory: AppCategory = AppCategory.Dialer,
    val activeStyle: AppStyle = AppStyle.Ios,
    val isPremium: Boolean = false,
    val textSize: String = "large",
    val highContrast: Boolean = false,
    val voicePrompts: Boolean = true,
    val voiceSpeed: Float = 0.9f,
    val customOptions: CustomOptions = CustomOptions(),
    
    val inputNumber: String = "",
    val activeCall: ActiveCall? = null,
    val iosActiveTab: String = "keypad",
    val notesActiveView: String = "list",
    val notesEditingId: String? = null,
    
    val currentQuestIndex: Int = 0,
    val completedQuests: Map<String, Boolean> = emptyMap(),
    val exploreTapCount: Int = 0,
    val showActiveHint: Boolean = false,
    
    val gameFindClicks: Int = 0,
    val gameFollowPattern: List<String> = emptyList(),
    val gameFollowUserIndex: Int = 0,
    val gameFollowIsFlashing: Boolean = false,
    val gameRiddleIndex: Int = 0,
    val gameRiddleFlags: Int = 0,
    val activeGameMode: String? = null,

    val notes: List<Note> = listOf(
        Note("1", "Shopping List", "Buy milk, eggs, bread, cheese, apples"),
        Note("2", "Doctor Appointment", "Monday at 10:00 AM with Dr. Smith. Bring medical reports.")
    ),
    val contacts: List<Contact> = listOf(
        Contact("Daughter (Sarah)", "555-0199", "family"),
        Contact("Son (Michael)", "555-0122", "family"),
        Contact("Doctor (Dr. Smith)", "555-9111", "doctor"),
        Contact("Grandson (Jake)", "555-4040", "family"),
        Contact("Pharmacy", "555-7788", "other")
    ),
    val recents: List<RecentCall> = listOf(
        RecentCall("Daughter (Sarah)", "555-0199", "outgoing", "10:15 AM"),
        RecentCall("Son (Michael)", "555-0122", "missed", "Yesterday")
    )
)
