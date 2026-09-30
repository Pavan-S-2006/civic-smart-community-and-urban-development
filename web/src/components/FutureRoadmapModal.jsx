const ROADMAP_ITEMS = [
  {
    title: 'Smart-City Analytics & Municipal Heatmaps',
    icon: '📊',
    scope: 'Roadmap (Post-MVP)',
    description: 'Aggregate hyper-local crowd reports into predictive infrastructure decay models. Provide city authorities with real-time heatmaps for asphalt wear, waterlogging risk, and lighting coverage.',
    highlights: ['Municipal Dashboard API', 'Infrastructure Decay Rate Analytics', 'Urgency Priority Ranking'],
  },
  {
    title: 'Tourism & Local Business Intelligence',
    icon: '🏢',
    scope: 'Roadmap (Post-MVP)',
    description: 'Provide safety and cleanliness trust metrics for commercial districts, transit hubs, and tourist landmarks. Enable local businesses to sponsor or request fast-track civic improvements.',
    highlights: ['Commercial Safety Ratings', 'Transit Hub Cleanliness Index', 'Public-Private Partnership Support'],
  },
  {
    title: 'Predictive Infrastructure Maintenance',
    icon: '🔮',
    scope: 'Roadmap (Post-MVP)',
    description: 'Deploy machine learning on historical weather patterns, traffic density, and user issue frequency to predict seasonal road collapse and storm drain clogging before they occur.',
    highlights: ['Monsoon Flood Risk Prediction', 'Preventative Dispatch Scheduling', 'Sensor IoT Data Fusion'],
  },
  {
    title: 'AI Civic Assistant & Automated Triage',
    icon: '🤖',
    scope: 'Roadmap (Post-MVP)',
    description: 'Autonomous AI agents that automatically analyze uploaded photo damage severity, route work orders directly to relevant municipal departments, and provide multi-lingual voice updates to citizens.',
    highlights: ['Multi-lingual Voice Agent', 'Computer Vision Severity Scoring', 'Auto Work-Order Generation'],
  },
];

export default function FutureRoadmapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-ink-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-ink-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl tracking-tight">Phase 6 — Future Opportunities</h3>
                <span className="text-[10px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full px-2.5 py-0.5">
                  Pitch Roadmap
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Strategic expansion capabilities beyond MVP scope for smart cities & governance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-300 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Pitch Body */}
        <div className="p-6 overflow-y-auto space-y-4 bg-surface-50">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
            <span>📢</span>
            <span><strong>Presenter Note:</strong> Frame these points as future scalability and commercialization opportunities during pitch judging.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROADMAP_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-ink-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                      {item.scope}
                    </span>
                  </div>
                  <h4 className="font-bold text-ink-900 text-sm mb-1.5 leading-snug">{item.title}</h4>
                  <p className="text-xs text-ink-600 leading-relaxed mb-3">{item.description}</p>
                </div>
                <div className="flex flex-wrap gap-1 border-t border-ink-100 pt-2.5">
                  {item.highlights.map((h, hIdx) => (
                    <span key={hIdx} className="text-[9px] font-semibold text-ink-500 bg-surface-200 rounded-md px-1.5 py-0.5">
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-ink-200 p-4 flex items-center justify-between">
          <p className="text-xs text-ink-400">CivicPulse Expansion Roadmap & Strategic Vision</p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-ink-900 hover:bg-black text-white transition-all shadow-sm"
          >
            Close Pitch Deck
          </button>
        </div>

      </div>
    </div>
  );
}
