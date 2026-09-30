import { isFirebaseConfigured } from '../firebase/config';

/**
 * Shows a prominent setup banner when Firebase credentials are missing.
 * Renders nothing once the project is configured.
 */
export default function FirebaseSetupBanner() {
  if (isFirebaseConfigured) return null;

  return (
    <div className="bg-black text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b-2 border-brand-600">
      <span className="text-brand-500 text-xl flex-shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">Firebase not configured — sign-up is disabled</p>
        <p className="text-xs text-zinc-400 mt-0.5">
          Create a <span className="text-brand-400 font-semibold">web/.env.local</span> file with your Firebase credentials, then restart the dev server.
        </p>
      </div>
      <a
        href="https://console.firebase.google.com"
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
      >
        Open Firebase Console →
      </a>
    </div>
  );
}
