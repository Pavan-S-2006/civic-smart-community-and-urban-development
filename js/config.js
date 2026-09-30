// CivicPulse Configuration File

export const CONFIG = {
  // Default Map Coordinates (New York City center fallback if GPS is unavailable)
  DEFAULT_LOCATION: {
    lat: 40.7128,
    lng: -74.0060,
    zoom: 13
  },

  // Proximity Threshold for Duplicate Detection (in meters)
  DUPLICATE_RADIUS_METERS: 150,

  // Firebase Configuration (Optional: Replace with real Firebase project credentials)
  FIREBASE: {
    apiKey: "AIzaSyYOUR_DEMO_KEY_HERE",
    authDomain: "civicpulse-demo.firebaseapp.com",
    projectId: "civicpulse-demo",
    storageBucket: "civicpulse-demo.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
  },

  // Gemini API Configuration for AI Smart Tagging & Claim Verification
  GEMINI_API_KEY: "", // Optional API key for Gemini endpoints

  // Gamification Point Values
  POINTS: {
    REPORT_ISSUE: 50,
    UPVOTE_ISSUE: 5,
    RESOLVE_ISSUE: 100,
    ADD_COMMENT: 10
  }
};
