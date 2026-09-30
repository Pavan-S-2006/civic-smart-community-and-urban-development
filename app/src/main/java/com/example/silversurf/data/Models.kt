package com.example.silversurf.data

import kotlinx.serialization.Serializable

sealed interface Screen {
    @Serializable data object Login : Screen
    @Serializable data object Home : Screen
    @Serializable data object Simulator : Screen
}

enum class AppCategory {
    Dialer, Notepad
}

enum class AppStyle {
    Ios, Android, Easy, Custom
}

data class CustomOptions(
    val theme: String = "sunset", // sunset, ocean, forest, cozy
    val shape: String = "rounded", // circle, rounded, square, capsule
    val buttonSize: Int = 64,
    val spacing: Int = 12,
    val borderWidth: Int = 2
)

data class ActiveCall(
    val name: String,
    val phone: String,
    val seconds: Int = 0
)

data class Note(
    val id: String,
    val title: String,
    val content: String,
    val color: String = "default",
    val pinned: Boolean = false,
    val time: String = "10:00 AM"
)

data class Contact(
    val name: String,
    val phone: String,
    val relationship: String
)

data class RecentCall(
    val name: String,
    val number: String,
    val type: String, // outgoing, incoming, missed
    val time: String
)

data class Quest(
    val id: String,
    val title: String,
    val description: String,
    val instruction: String,
    val simulator: String, // "ios", "android", "easy", "any"
    val targetType: String, // "click", "game", "input"
    val targetSelector: String = "",
    val hint: String
)
