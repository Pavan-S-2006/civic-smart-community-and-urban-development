import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { subscribeToIssues } from '../firebase/issues';
import { seedDemoIssues } from '../firebase/seed';
import IssueFormModal   from '../components/IssueFormModal';
import IssueDetailPanel from '../components/IssueDetailPanel';
import JukeboxModal     from '../components/JukeboxModal';
import FutureRoadmapModal from '../components/FutureRoadmapModal';
import UserProfileModal from '../components/UserProfileModal';
import CivicCommunityModal from '../components/CivicCommunityModal';

// ── Fix Leaflet's broken default icon paths in Vite ──────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const CATEGORY_COLORS = {
  'Pothole':     '#ef4444',
  'Flooding':    '#3b82f6',
  'Streetlight': '#f59e0b',
  'Garbage':     '#10b981',
  'Vandalism':   '#8b5cf6',
  'Other':       '#6b7280',
};

export const STATUS_BADGE = {
  'Reported':    'bg-red-100 text-red-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Resolved':    'bg-green-100 text-green-700',
};

function makeIcon(color, pulse = false) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;">
        ${pulse ? `<div style="
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          width:48px; height:48px;
          border-radius:50%;
          background:${color}33;
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>` : ''}
        <div style="
          width:28px; height:28px;
          background:${color};
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          position:relative;
        "></div>
      </div>`,
    iconSize:    [28, 28],
    iconAnchor:  [14, 28],
    popupAnchor: [0, -32],
  });
}

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 15, { animate: true });
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

const CATEGORIES = ['All', ...Object.keys(CATEGORY_COLORS)];
const STATUSES = ['All', 'Reported', 'In Progress', 'Resolved'];
const RELIABILITIES = ['All', 'High Reliability', 'Medium Reliability', 'Unverified'];
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi

export default function MapPage({ externalShowProfile, onResetProfileTrigger, externalShowCommunity, onResetCommunityTrigger }) {
  const [issues,            setIssues]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [userCoords,        setUserCoords]        = useState(null);
  const [locError,          setLocError]          = useState('');
  const [locLoading,        setLocLoading]        = useState(false);
  const [clickCoords,       setClickCoords]       = useState(null);
  const [showForm,          setShowForm]          = useState(false);
  const [selected,          setSelected]          = useState(null);
  
  // Filters
  const [filterCategory,    setFilterCategory]    = useState('All');
  const [filterStatus,      setFilterStatus]      = useState('All');
  const [filterReliability, setFilterReliability] = useState('All');

  const [jukeboxTarget,     setJukeboxTarget]     = useState(null);
  const [showRoadmap,       setShowRoadmap]       = useState(false);
  const [showProfile,       setShowProfile]       = useState(false);
  const [showCommunity,     setShowCommunity]     = useState(false);
  const [seeding,           setSeeding]           = useState(false);
  const [seedNotice,        setSeedNotice]        = useState('');

  useEffect(() => {
    if (externalShowProfile) {
      setShowProfile(true);
      onResetProfileTrigger?.();
    }
  }, [externalShowProfile]);

  useEffect(() => {
    if (externalShowCommunity) {
      setShowCommunity(true);
      onResetCommunityTrigger?.();
    }
  }, [externalShowCommunity]);



  // ── Real-time Firestore subscription ────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToIssues((data) => {
      setIssues(data);
      setLoading(false);
      // Auto seed if empty
      if (data.length === 0) {
        seedDemoIssues(false);
      }
    });
    return unsub;
  }, []);

  const center = userCoords ?? DEFAULT_CENTER;

  // Filter pipeline
  const filtered = issues.filter(issue => {
    if (filterCategory !== 'All' && issue.category !== filterCategory) return false;
    if (filterStatus !== 'All' && issue.status !== filterStatus) return false;
    if (filterReliability !== 'All') {
      const votes = issue.upvotes ?? 0;
      if (filterReliability === 'High Reliability' && votes < 10) return false;
      if (filterReliability === 'Medium Reliability' && (votes < 3 || votes >= 10)) return false;
      if (filterReliability === 'Unverified' && votes >= 3) return false;
    }
    return true;
  });

  async function handleSeed(force = true) {
    setSeeding(true);
    setSeedNotice('');
    const res = await seedDemoIssues(force);
    setSeeding(false);
    if (res.success) {
      setSeedNotice(res.message);
      setTimeout(() => setSeedNotice(''), 4000);
    } else {
      setSeedNotice('Seeding failed: ' + res.error);
    }
  }

  function handleMapClick(latlng) {
    setClickCoords({ lat: latlng.lat, lng: latlng.lng });
    setShowForm(true);
    setSelected(null);
  }

  function locateMe() {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => {
        setLocError('Could not get location. Check browser permissions.');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function resetFilters() {
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterReliability('All');
  }

  // Sync selected issue with live updates
  useEffect(() => {
    if (selected) {
      const live = issues.find(i => i.id === selected.id);
      if (live) setSelected(live);
    }
  }, [issues]);

  return (
    <div className="flex h-full">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-84 flex-shrink-0 bg-white border-r border-ink-200 flex flex-col overflow-hidden">

        {/* Header & Quick Action Buttons */}
        <div className="p-4 border-b border-ink-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-ink-900 text-sm tracking-tight flex items-center gap-1.5">
              <span>📍</span> Live Issue Feed
            </h2>
            {loading
              ? <span className="text-[10px] text-ink-300 animate-pulse">Loading…</span>
              : <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                  {filtered.length} of {issues.length} shown
                </span>
            }
          </div>

          {/* Profile Action Control */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            title="View your reported complaints and StarPoints balance"
          >
            <span>⭐</span> My Profile & StarPoints
          </button>

          {/* Category pills */}
          <div>
            <p className="text-[9px] font-bold text-ink-400 uppercase tracking-wider mb-1">Category</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                    filterCategory === cat
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-500 border-ink-200 hover:border-brand-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status & Reliability Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-ink-400 uppercase tracking-wider block mb-0.5">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full text-xs font-semibold bg-surface-100 border border-ink-200 rounded-lg px-2 py-1 text-ink-800 focus:outline-none focus:border-brand-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-ink-400 uppercase tracking-wider block mb-0.5">Reliability</label>
              <select
                value={filterReliability}
                onChange={e => setFilterReliability(e.target.value)}
                className="w-full text-xs font-semibold bg-surface-100 border border-ink-200 rounded-lg px-2 py-1 text-ink-800 focus:outline-none focus:border-brand-500"
              >
                {RELIABILITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Locate me + Raise issue + Seed demo */}
        <div className="px-4 py-3 border-b border-ink-200 flex flex-col gap-2 bg-surface-50">
          <div className="flex gap-2">
            <button
              onClick={locateMe}
              disabled={locLoading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-black hover:bg-ink-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl py-2 transition-all"
            >
              {locLoading
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Locating…</>
                : <>📍 Use location</>
              }
            </button>
            <button
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl py-2 transition-all shadow-sm"
              title="Populate map with realistic sample issues for judging"
            >
              {seeding ? '🌱 Seeding…' : '🌱 Seed Demo Data'}
            </button>
          </div>

          <button
            onClick={() => {
              setClickCoords(userCoords ?? DEFAULT_CENTER);
              setShowForm(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl py-2.5 transition-all shadow-sm"
          >
            ＋ Raise an Issue
          </button>

          {seedNotice && <p className="text-[10px] text-emerald-700 font-semibold text-center">{seedNotice}</p>}
          {locError && <p className="text-xs text-brand-600">{locError}</p>}
          {userCoords && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Located — {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto divide-y divide-ink-100">
          {loading && (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse space-y-2.5">
                  <div className="h-4 bg-ink-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-ink-100 rounded-lg w-1/2" />
                  <div className="h-12 bg-ink-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <p className="text-4xl">🏙️</p>
              <div>
                <p className="text-sm font-bold text-ink-900">No issues match filters</p>
                <p className="text-xs text-ink-400 mt-1">
                  Try clearing filter criteria or seed sample data for demo judging.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs font-bold bg-ink-100 hover:bg-ink-200 text-ink-800 rounded-xl transition-all"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => handleSeed(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  🌱 Seed Issues
                </button>
              </div>
            </div>
          )}

          {filtered.map(issue => (
            <div
              key={issue.id}
              className={`w-full text-left px-4 py-3.5 hover:bg-surface-100 transition-colors ${
                selected?.id === issue.id ? 'bg-brand-50 border-l-3 border-brand-600' : ''
              }`}
            >
              <div
                className="cursor-pointer"
                onClick={() => setSelected(issue)}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-ink-900 leading-snug line-clamp-2 flex-1">{issue.title}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: CATEGORY_COLORS[issue.category] }}
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[10px] text-ink-400">{issue.category}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[issue.status]}`}>
                    {issue.status}
                  </span>
                  <span className="text-[10px] text-ink-400 ml-auto">👍 {issue.upvotes ?? 0}</span>
                </div>

                {/* Reliability Badge */}
                <div className="mb-2 flex items-center gap-1 text-[9px] text-ink-500 bg-surface-100 px-2 py-1 rounded-md border border-ink-100">
                  <span>🛡️</span>
                  <span className="font-medium">
                    {(issue.upvotes ?? 0) >= 10 ? 'High Reliability' : (issue.upvotes ?? 0) >= 3 ? 'Medium Reliability' : 'Pending Verification'}
                  </span>
                </div>

                {issue.photoURL && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img src={issue.photoURL} alt="" className="w-full h-20 object-cover" />
                  </div>
                )}
              </div>

              {/* Jukebox Quick Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setJukeboxTarget(issue);
                }}
                className="w-full mt-1 bg-ink-900 hover:bg-black text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>🎵 Jukebox (Public Talk)</span>
                {issue.commentCount ? (
                  <span className="bg-brand-600 text-white text-[9px] px-1.5 py-0.2 rounded-full">
                    {issue.commentCount}
                  </span>
                ) : null}
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 bg-surface-100 border-t border-ink-200">
          <p className="text-[10px] text-ink-400 text-center font-medium">
            🗺️ Click anywhere on map to drop a pin & report issue
          </p>
        </div>
      </aside>

      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">

        <style>{`
          @keyframes ping {
            75%, 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        `}</style>

        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap coords={userCoords} />
          <MapClickHandler onClick={handleMapClick} />

          {/* User location */}
          {userCoords && (
            <>
              <Circle
                center={[userCoords.lat, userCoords.lng]}
                radius={80}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1.5 }}
              />
              <Marker position={[userCoords.lat, userCoords.lng]} icon={makeIcon('#ef4444', true)}>
                <Popup><div className="text-xs font-bold">📍 You are here</div></Popup>
              </Marker>
            </>
          )}

          {/* Live issue pins */}
          {filtered.map(issue => (
            <Marker
              key={issue.id}
              position={[issue.lat, issue.lng]}
              icon={makeIcon(CATEGORY_COLORS[issue.category] ?? '#6b7280', (issue.upvotes ?? 0) >= 10)}
              eventHandlers={{ click: () => { setSelected(issue); setShowForm(false); } }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-2">
                  <p className="font-bold text-xs text-ink-900">{issue.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-ink-400">{issue.category}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[issue.status]}`}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-ink-100">
                    <span className="text-[10px] text-ink-400">👍 {issue.upvotes ?? 0}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setJukeboxTarget(issue);
                      }}
                      className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-brand-700 transition"
                    >
                      🎵 Jukebox
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Custom zoom controls */}
        <div className="absolute top-4 right-4 z-[999] flex flex-col gap-1">
          <button
            onClick={() => document.querySelector('.leaflet-control-zoom-in')?.click()}
            className="w-9 h-9 bg-white border border-ink-200 rounded-xl shadow text-ink-600 font-bold text-xl flex items-center justify-center hover:bg-surface-100 transition"
          >+</button>
          <button
            onClick={() => document.querySelector('.leaflet-control-zoom-out')?.click()}
            className="w-9 h-9 bg-white border border-ink-200 rounded-xl shadow text-ink-600 font-bold text-xl flex items-center justify-center hover:bg-surface-100 transition"
          >−</button>
        </div>

        {/* Issue count badge */}
        <div className="absolute top-4 left-4 z-[999] bg-black/90 text-white text-xs font-bold rounded-xl px-3 py-2 shadow backdrop-blur-sm flex items-center gap-2">
          <span>📍</span>
          <span>{loading ? '…' : filtered.length} issue{filtered.length !== 1 ? 's' : ''} on map</span>
        </div>

        {/* FAB — Raise Issue */}
        <button
          onClick={() => {
            setClickCoords(userCoords ?? DEFAULT_CENTER);
            setShowForm(true);
            setSelected(null);
          }}
          className="absolute bottom-6 right-6 z-[999] bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl px-5 py-3 shadow-xl hover:shadow-brand-600/40 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-lg">＋</span> Raise Issue
        </button>

        {/* Issue detail panel */}
        {selected && !showForm && (
          <IssueDetailPanel
            issue={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* Issue form modal */}
      {showForm && clickCoords && (
        <IssueFormModal
          coords={clickCoords}
          existingIssues={issues}
          onClose={() => setShowForm(false)}
          onSubmitted={() => setShowForm(false)}
        />
      )}

      {/* Jukebox Modal */}
      {jukeboxTarget && (
        <JukeboxModal
          issue={jukeboxTarget}
          onClose={() => setJukeboxTarget(null)}
        />
      )}

      {/* Future Roadmap Pitch Modal */}
      <FutureRoadmapModal
        isOpen={showRoadmap}
        onClose={() => setShowRoadmap(false)}
      />

      {/* User Profile & StarPoints Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onOpenPitch={() => setShowRoadmap(true)}
        issues={issues}
      />

      {/* Civic Community Hub Modal */}
      <CivicCommunityModal
        isOpen={showCommunity}
        onClose={() => setShowCommunity(false)}
        issues={issues}
        userCoords={userCoords}
        onSelectIssue={(issue) => {
          setSelected(issue);
          setUserCoords({ lat: issue.lat, lng: issue.lng });
        }}
      />
    </div>
  );
}
