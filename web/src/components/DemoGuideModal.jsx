import { useState } from 'react';

const DEMO_STEPS = [
  {
    step: 1,
    title: '1. Report an Issue',
    icon: '📍',
    tagline: 'Pinpoint & Upload in Seconds',
    action: 'Click anywhere on the map or tap "📍 Use my location" to select a coordinate, choose a category (e.g., Pothole, Flooding), upload a photo, and submit.',
    tip: 'Observe how the location coordinates auto-populate seamlessly.',
  },
  {
    step: 2,
    title: '2. Community Verification',
    icon: '👍',
    tagline: 'Crowdsourced Consensus & Reliability',
    action: 'Click an issue card in the feed. Tap the 👍 Upvote button to build community consensus. Issues gain "High Reliability" status as upvotes increase.',
    tip: 'Prevents spam & helps municipal teams prioritize urgent civic concerns.',
  },
  {
    step: 3,
    title: '3. Smart Tagging & Categorization',
    icon: '🏷️',
    tagline: 'Automated Classification & Badging',
    action: 'Filter issues by Category (Pothole, Flooding, Streetlight, Garbage, Vandalism) or Reliability level using the top pill filters.',
    tip: 'Color-coded custom pin markers render on the map with glowing pulse animations for high-upvote issues.',
  },
  {
    step: 4,
    title: '4. Public Talk (Jukebox Audio & Chat)',
    icon: '🎵',
    tagline: 'Hyper-Local Community Voice Discussion',
    action: 'Click "🎵 Jukebox (Public Talk)" on any issue to open the audio & text discussion room. Listen to audio notes, upload voice updates, or post comments.',
    tip: 'Audio notes foster human connection and accessibility for all citizens.',
  },
  {
    step: 5,
    title: '5. Track & Resolve Status',
    icon: '⚡',
    tagline: 'End-to-End Lifecycle Tracking',
    action: 'Open the Issue Detail panel and toggle status between Reported ➔ In Progress ➔ Resolved. Watch live badge updates across the map.',
    tip: 'Transparent civic accountability for citizens and city administrators.',
  },
];

export default function DemoGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const current = DEMO_STEPS[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-ink-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-ink-900 via-ink-800 to-brand-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Live Demo Rehearsal Guide</h3>
              <p className="text-xs text-ink-300">Phase 5 — Report ➔ Verify ➔ Tag ➔ Discuss ➔ Track</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-surface-100 border-b border-ink-200 px-6 py-3 flex items-center justify-between">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeStep === idx
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-400'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">Step {s.step}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-start gap-4 bg-brand-50 border border-brand-100 p-4 rounded-xl">
            <span className="text-4xl p-2 bg-white rounded-xl shadow-sm border border-brand-100">
              {current.icon}
            </span>
            <div>
              <div className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider mb-0.5">
                {current.tagline}
              </div>
              <h4 className="font-bold text-ink-900 text-base">{current.title}</h4>
              <p className="text-xs text-ink-600 leading-relaxed mt-1">{current.action}</p>
            </div>
          </div>

          <div className="bg-surface-200/70 border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="text-xs font-medium text-ink-800">
              <strong className="text-brand-600">Demo Tip:</strong> {current.tip}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t border-ink-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-ink-200 text-ink-600 hover:bg-surface-100 disabled:opacity-40 transition-all"
          >
            ← Previous
          </button>

          <span className="text-xs text-ink-400 font-semibold">
            {activeStep + 1} of {DEMO_STEPS.length}
          </span>

          {activeStep < DEMO_STEPS.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(DEMO_STEPS.length - 1, prev + 1))}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm"
            >
              ✓ Ready for Judging!
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
