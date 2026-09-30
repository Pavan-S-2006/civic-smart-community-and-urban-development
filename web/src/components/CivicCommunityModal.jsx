import { useState, useMemo } from 'react';

// Preset Regions with approximate lat/lng centers
const REGION_PRESETS = [
  { id: 'all', label: '🌐 All Regions (Global)', lat: null, lng: null },
  { id: 'delhi', label: '📍 Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { id: 'mumbai', label: '📍 Mumbai Metro', lat: 19.0760, lng: 72.8777 },
  { id: 'bengaluru', label: '📍 Bengaluru IT Hub', lat: 12.9716, lng: 77.5946 },
  { id: 'nyc', label: '🗽 New York Metro', lat: 40.7128, lng: -74.0060 },
  { id: 'london', label: '🇬🇧 Greater London', lat: 51.5074, lng: -0.1278 },
  { id: 'tokyo', label: '🗼 Tokyo Metropolitan', lat: 35.6762, lng: 139.6503 },
];

const CATEGORIES = ['All', 'Pothole', 'Flooding', 'Streetlight', 'Garbage', 'Vandalism', 'Other'];
const STATUSES = ['All', 'Reported', 'In Progress', 'Resolved'];

// Calculate distance between two coordinates in kilometers (Haversine formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function CivicCommunityModal({ isOpen, onClose, issues = [], userCoords, onSelectIssue }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('problems'); // 'problems' | 'report_files'
  const [inspectReportFile, setInspectReportFile] = useState(null);

  if (!isOpen) return null;

  // Active region details
  const activeRegionObj = REGION_PRESETS.find(r => r.id === selectedRegion);

  // Filter issues based on region, search, category, and status
  const filteredIssues = issues.filter(issue => {
    // Search query filter (title, description, category, reporter, report ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const reportId = `CIVIC-REP-${issue.id ? issue.id.slice(0, 6).toUpperCase() : '2026'}`;
      const matchesText =
        issue.title?.toLowerCase().includes(q) ||
        issue.description?.toLowerCase().includes(q) ||
        issue.category?.toLowerCase().includes(q) ||
        issue.reportedByName?.toLowerCase().includes(q) ||
        reportId.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && issue.category !== selectedCategory) return false;

    // Status filter
    if (selectedStatus !== 'All' && issue.status !== selectedStatus) return false;

    // Regional filter
    if (activeRegionObj && activeRegionObj.lat !== null) {
      const dist = getDistanceKm(activeRegionObj.lat, activeRegionObj.lng, issue.lat, issue.lng);
      // Include within 75km radius for region filter
      if (dist !== null && dist > 75) return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative text-white">
        
        {/* Top Header Bar */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-brand-600/30 border border-brand-400/30">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Civic Community Hub</h2>
                <span className="text-[10px] font-extrabold bg-brand-500/20 text-brand-300 border border-brand-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Global & Regional
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Explore local community problems, check regional telemetry, and search report files worldwide.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end md:self-auto w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Global Search Bar Section */}
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-col gap-3">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-base">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search reports, issue files, categories, locations, reporters worldwide... (e.g. 'Pothole', 'Connaught', 'CIVIC-REP')"
              className="w-full bg-zinc-950/90 border border-zinc-700/80 focus:border-brand-500 rounded-2xl py-3 pl-11 pr-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Region Pills & Category Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Region Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pr-1">Region:</span>
              {REGION_PRESETS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedRegion === r.id
                      ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Quick Tab Switch */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('problems')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'problems'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🚨 Problems Feed ({filteredIssues.length})
              </button>
              <button
                onClick={() => setActiveTab('report_files')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'report_files'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                📁 Report Files ({filteredIssues.length})
              </button>
            </div>
          </div>

          {/* Secondary Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Category:</span>
              <div className="flex gap-1 overflow-x-auto">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-medium">Status:</span>
              <div className="flex gap-1">
                {STATUSES.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/40">
          {filteredIssues.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
              <span className="text-4xl mb-2">🔍</span>
              <h3 className="text-base font-bold text-zinc-300">No problems found</h3>
              <p className="text-xs text-zinc-500 max-w-md mt-1">
                No civic issues match your current region filter ({activeRegionObj?.label}) and search query ("{searchQuery}").
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('all');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                }}
                className="mt-4 text-xs font-bold text-brand-400 hover:text-brand-300 underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : activeTab === 'problems' ? (
            /* Problems Grid Feed */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIssues.map((issue, idx) => {
                const distFromUser = userCoords
                  ? getDistanceKm(userCoords.lat, userCoords.lng, issue.lat, issue.lng)
                  : null;

                return (
                  <div
                    key={issue.id || idx}
                    className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xl group"
                  >
                    <div>
                      {/* Image Thumbnail or Placeholder */}
                      <div className="relative w-full h-36 rounded-xl bg-zinc-950 overflow-hidden mb-3 border border-zinc-800">
                        {issue.photoURL ? (
                          <img
                            src={issue.photoURL}
                            alt={issue.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-gradient-to-b from-zinc-900 to-zinc-950">
                            <span className="text-3xl mb-1">🏛️</span>
                            <span className="text-[10px] font-semibold">Civic Photo Report</span>
                          </div>
                        )}
                        <span className={`absolute top-2 left-2 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : issue.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {issue.status}
                        </span>

                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-black/70 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {issue.category}
                        </span>
                      </div>

                      {/* Issue Title & Description */}
                      <h4 className="font-bold text-sm text-zinc-100 group-hover:text-brand-300 transition-colors line-clamp-1">
                        {issue.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-semibold text-zinc-300">
                          👤 {issue.reportedByName || 'Citizen Reporter'}
                        </span>
                        <span className="flex items-center gap-1 font-extrabold text-amber-400">
                          ⭐ {issue.upvotes || 0} upvotes
                        </span>
                      </div>

                      {distFromUser !== null && (
                        <div className="text-[10px] font-semibold text-brand-300 flex items-center gap-1">
                          📍 {distFromUser} km from your current GPS location
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectIssue?.(issue);
                          }}
                          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20 cursor-pointer"
                        >
                          <span>📍</span> Focus on Map
                        </button>
                        <button
                          onClick={() => setInspectReportFile(issue)}
                          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="View official report file"
                        >
                          <span>📄</span> File
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Report Files Tab */
            <div className="space-y-3">
              {filteredIssues.map((issue, idx) => {
                const reportCode = `CIVIC-REP-2026-${String(idx + 101).padStart(4, '0')}`;
                return (
                  <div
                    key={issue.id || idx}
                    className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400 flex-shrink-0">
                        📄
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-300">{reportCode}</span>
                          <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                            {issue.category}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-400">
                            Verified Telemetry
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-200 mt-0.5">{issue.title}</h4>
                        <p className="text-xs text-zinc-400">
                          Lat: {issue.lat?.toFixed(4)}, Lng: {issue.lng?.toFixed(4)} • Reported by {issue.reportedByName || 'Citizen'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setInspectReportFile(issue)}
                        className="bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>👁️</span> Inspect Document
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <strong className="text-zinc-200">{filteredIssues.length}</strong> of <strong className="text-zinc-200">{issues.length}</strong> global community reports
          </div>
          <div className="flex items-center gap-3">
            <span>⚡ Powered by CivicPulse AI Regional Index</span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white font-bold cursor-pointer underline"
            >
              Close
            </button>
          </div>
        </div>

        {/* Document Inspection Drawer/Modal Overlay */}
        {inspectReportFile && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[2100] flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden text-white shadow-2xl">
              <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Official Municipal Report File</h3>
                    <p className="text-[11px] font-mono text-brand-300">
                      ID: CIVIC-REP-2026-{(inspectReportFile.id || '001').slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectReportFile(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
                <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 space-y-3 font-mono">
                  <div className="flex justify-between border-b border-zinc-800 pb-2 text-[11px] text-zinc-400">
                    <span>DOCUMENT_STATUS: OFFICIAL_RECORD</span>
                    <span className="text-emerald-400">STATUS: {inspectReportFile.status?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">SUBJECT:</span> <span className="text-white font-bold">{inspectReportFile.title}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">CATEGORY:</span> <span className="text-brand-300">{inspectReportFile.category}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">GEO_COORDINATES:</span> <span className="text-amber-300">{inspectReportFile.lat}, {inspectReportFile.lng}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">FILED_BY:</span> <span className="text-zinc-300">{inspectReportFile.reportedByName || 'Verified Citizen'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">COMMUNITY_UPVOTES:</span> <span className="text-amber-400">{inspectReportFile.upvotes || 0} Votes</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">AI_RELIABILITY_SCORE:</span> <span className="text-emerald-300">{inspectReportFile.reliabilityScore || 'High Reliability (Verified)'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-300 mb-1">Detailed Field Observations</h4>
                  <p className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 leading-relaxed">
                    {inspectReportFile.description}
                  </p>
                </div>

                {inspectReportFile.photoURL && (
                  <div>
                    <h4 className="font-bold text-zinc-300 mb-1 font-mono text-[11px]">ATTACHED_EVIDENCE_PHOTO:</h4>
                    <img
                      src={inspectReportFile.photoURL}
                      alt="Evidence"
                      className="w-full max-h-56 object-cover rounded-xl border border-zinc-800"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">CivicPulse Verification Telemetry & Blockchain Proof</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inspectReportFile, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `CIVIC_REPORT_${inspectReportFile.id || '2026'}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    ⬇ Export Report (JSON)
                  </button>
                  <button
                    onClick={() => setInspectReportFile(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-1.5 px-3 rounded-xl cursor-pointer"
                  >
                    Close Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
