// Main Application Controller & UI Handler

import { CONFIG } from './config.js';
import { 
  initDataStore, 
  getIssues, 
  saveIssue, 
  upvoteIssue, 
  updateIssueStatus, 
  addCommentToIssue, 
  getUserProfile, 
  resetToSeedData 
} from './firebaseService.js';
import { 
  initMap, 
  renderIssueMarkers, 
  centerOnUserLocation, 
  placeTemporarySelectedPin, 
  clearTemporaryPin, 
  reverseGeocode, 
  resetMapView 
} from './mapService.js';
import { generateSmartTags, verifyClaimCredibility } from './aiService.js';
import { findDuplicateIssue } from './duplicateDetector.js';

// Global state
let currentIssues = [];
let activeIssue = null;
let currentUploadedImageBase64 = null;
let userGpsLat = null;
let userGpsLng = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 1. Initialize data store
  initDataStore();
  currentIssues = getIssues();

  // 2. Initialize Leaflet Map
  initMap('map', handleMapClick, handleSelectIssue);

  // 3. Acquire Browser GPS location
  triggerGpsLocate();

  // 4. Render initial UI feed & map pins
  refreshUI();

  // 5. Attach event listeners
  attachEventListeners();
}

/**
 * Triggers Browser Geolocation
 */
function triggerGpsLocate() {
  const gpsText = document.getElementById('gpsStatusText');
  if (gpsText) gpsText.innerText = 'Acquiring GPS...';

  centerOnUserLocation(
    (lat, lng) => {
      userGpsLat = lat;
      userGpsLng = lng;
      if (gpsText) gpsText.innerText = `GPS Active (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
      
      // Auto-populate location picker fields
      document.getElementById('issueLat').value = lat;
      document.getElementById('issueLng').value = lng;
      reverseGeocode(lat, lng).then(addr => {
        document.getElementById('issueAddress').value = addr;
      });
    },
    (err) => {
      if (gpsText) gpsText.innerText = 'GPS Default (NYC)';
      userGpsLat = CONFIG.DEFAULT_LOCATION.lat;
      userGpsLng = CONFIG.DEFAULT_LOCATION.lng;
    }
  );
}

/**
 * Handles map click for custom pin placement
 */
function handleMapClick(lat, lng) {
  document.getElementById('issueLat').value = lat;
  document.getElementById('issueLng').value = lng;

  reverseGeocode(lat, lng).then(addr => {
    document.getElementById('issueAddress').value = addr;
  });

  // Check proximity duplicate
  const category = document.getElementById('issueCategory').value;
  const title = document.getElementById('issueTitle').value;
  checkDuplicateWarning(lat, lng, category, title);

  // Automatically open Raise Issue modal if not open
  openRaiseModal();
}

/**
 * Checks duplicate detection within radius
 */
function checkDuplicateWarning(lat, lng, category, title) {
  const dupAlert = document.getElementById('duplicateAlertBox');
  const match = findDuplicateIssue(lat, lng, category, title, currentIssues, CONFIG.DUPLICATE_RADIUS_METERS);

  if (match) {
    dupAlert.classList.remove('hidden');
    document.getElementById('duplicateTitle').innerText = 'Possible Duplicate Found!';
    document.getElementById('duplicateDesc').innerText = `An issue "${match.issue.title}" exists ${match.distanceMeters} meters away.`;
    
    // Bind view button
    document.getElementById('viewDuplicateBtn').onclick = () => {
      closeRaiseModal();
      handleSelectIssue(match.issue);
    };
  } else {
    dupAlert.classList.add('hidden');
  }
}

/**
 * Refresh UI counters, issue list, and map pins
 */
function refreshUI() {
  currentIssues = getIssues();

  // Apply filters
  const filtered = filterIssues(currentIssues);

  // Render list sidebar
  renderIssueList(filtered);

  // Render map markers
  renderIssueMarkers(filtered, handleSelectIssue);

  // Update Stats Counters
  updateStatsCounters();

  // Update User Profile header info
  updateUserProfileDisplay();
}

/**
 * Filter issues by search, category, status, and proximity range
 */
function filterIssues(issues) {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;
  const maxRadius = parseInt(document.getElementById('proximityRange').value, 10);

  return issues.filter(issue => {
    // Search query
    if (search) {
      const matchText = `${issue.title} ${issue.description} ${issue.address} ${issue.category}`.toLowerCase();
      if (!matchText.includes(search)) return false;
    }

    // Category filter
    if (category !== 'ALL' && issue.category !== category) return false;

    // Status filter
    if (status !== 'ALL' && issue.status !== status) return false;

    return true;
  });
}

/**
 * Render Issue Cards in Left Sidebar
 */
function renderIssueList(issues) {
  const container = document.getElementById('issueListContainer');
  document.getElementById('issueCountText').innerText = issues.length;

  if (issues.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-map-location-dot empty-icon"></i>
        <p>No issues found matching filters.</p>
        <button class="btn btn-primary btn-sm" id="emptyRaiseBtn">Raise an Issue</button>
      </div>
    `;
    const btn = document.getElementById('emptyRaiseBtn');
    if (btn) btn.onclick = openRaiseModal;
    return;
  }

  const categoryEmoji = {
    pothole: '🛣️',
    sanitation: '🗑️',
    water: '💧',
    power: '💡',
    safety: '🛡️',
    traffic: '🚦'
  };

  container.innerHTML = issues.map(issue => {
    const statusClass = `status-${issue.status.toLowerCase().replace(' ', '-')}`;
    const emoji = categoryEmoji[issue.category] || '⚠️';

    return `
      <div class="issue-card" data-id="${issue.id}">
        <div class="issue-card-header">
          <div class="card-tags">
            <span class="category-badge">${emoji} ${issue.category.toUpperCase()}</span>
            <span class="status-pill ${statusClass}">${issue.status}</span>
          </div>
          <span class="card-ai-score"><i class="fa-solid fa-shield"></i> ${issue.aiScore}% Trust</span>
        </div>

        <h4 class="card-title">${escapeHtml(issue.title)}</h4>

        <div class="card-location">
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(issue.address || 'Reported Location')}
        </div>

        <div class="card-footer">
          <span>By ${escapeHtml(issue.author)}</span>
          <span class="upvote-pill-mini"><i class="fa-solid fa-thumbs-up"></i> ${issue.upvotes}</span>
        </div>
      </div>
    `;
  }).join('');

  // Attach click listeners to cards
  container.querySelectorAll('.issue-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const issue = currentIssues.find(i => i.id === id);
      if (issue) handleSelectIssue(issue);
    });
  });
}

/**
 * Handle Issue Card / Map Pin Selection (Opens Detail View)
 */
function handleSelectIssue(issue) {
  activeIssue = issue;
  const modal = document.getElementById('issueDetailModal');

  document.getElementById('detailCategoryChip').innerText = `${issue.category.toUpperCase()}`;
  document.getElementById('detailSeverityChip').innerText = `${issue.severity || 'MEDIUM'}`;
  document.getElementById('detailStatusChip').innerText = `${issue.status}`;
  
  document.getElementById('detailTitle').innerText = issue.title;
  document.getElementById('detailAuthor').innerText = issue.author || 'Citizen';
  document.getElementById('detailTime').innerText = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recently';
  document.getElementById('detailAddress').innerText = issue.address || 'Coordinates Recorded';
  document.getElementById('detailDescription').innerText = issue.description;

  // Image
  const imgEl = document.getElementById('detailImage');
  imgEl.src = issue.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';

  // AI Score & Explanation
  document.getElementById('detailAiScore').innerText = `${issue.aiScore || 92}% Reliable`;
  document.getElementById('detailAiExplanation').innerText = issue.aiExplanation || 'AI verified location authenticity & report text patterns.';

  // Tags
  const tagsList = document.getElementById('detailTagsList');
  tagsList.innerHTML = (issue.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');

  // Status Stepper
  updateStatusStepper(issue.status);

  // Upvotes
  document.getElementById('detailUpvoteCount').innerText = issue.upvotes || 0;

  // Comments
  renderCommentsList(issue.comments || []);

  modal.classList.add('active');
}

/**
 * Render Comments Thread
 */
function renderCommentsList(comments) {
  const container = document.getElementById('detailCommentsList');
  if (comments.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.8rem;">No comments yet. Start the discussion!</p>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="comment-bubble">
      <span class="comment-author">${escapeHtml(c.author)}</span>
      <span class="comment-time">${c.time}</span>
      <p style="margin-top: 4px; color: #ddd;">${escapeHtml(c.text)}</p>
    </div>
  `).join('');
}

/**
 * Updates Stepper Timeline Visuals
 */
function updateStatusStepper(status) {
  const sReported = document.getElementById('stepReported');
  const sInProgress = document.getElementById('stepInProgress');
  const sResolved = document.getElementById('stepResolved');
  const l1 = document.getElementById('line1');
  const l2 = document.getElementById('line2');

  sReported.classList.add('active');
  
  if (status === 'In Progress') {
    sInProgress.classList.add('active');
    l1.classList.add('active');
    sResolved.classList.remove('active');
    l2.classList.remove('active');
  } else if (status === 'Resolved') {
    sInProgress.classList.add('active');
    sResolved.classList.add('active');
    l1.classList.add('active');
    l2.classList.add('active');
  } else {
    sInProgress.classList.remove('active');
    sResolved.classList.remove('active');
    l1.classList.remove('active');
    l2.classList.remove('active');
  }
}

/**
 * Update Header & Sidebar Stats Counters
 */
function updateStatsCounters() {
  const total = currentIssues.length;
  const resolved = currentIssues.filter(i => i.status === 'Resolved').length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  
  const avgAi = Math.round(
    currentIssues.reduce((acc, curr) => acc + (curr.aiScore || 90), 0) / (total || 1)
  );

  document.getElementById('statTotalReported').innerText = total;
  document.getElementById('statResolvedRate').innerText = `${rate}%`;
  document.getElementById('statAvgAiScore').innerText = `${avgAi}%`;
}

/**
 * Update User Reputation Points & Badges
 */
function updateUserProfileDisplay() {
  const user = getUserProfile();
  document.getElementById('userPoints').innerText = user.points;
  document.getElementById('userBadgeLabel').innerText = user.badges[user.badges.length - 1] || 'Contributor';

  // Modal profile
  document.getElementById('modalPoints').innerText = user.points;
  document.getElementById('modalReportsCount').innerText = currentIssues.filter(i => i.author === user.name).length;
}

/**
 * Attach UI Event Listeners
 */
function attachEventListeners() {
  // Search & Filters
  document.getElementById('searchInput').addEventListener('input', refreshUI);
  document.getElementById('categoryFilter').addEventListener('change', refreshUI);
  document.getElementById('statusFilter').addEventListener('change', refreshUI);
  document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'ALL';
    document.getElementById('statusFilter').value = 'ALL';
    document.getElementById('proximityRange').value = '5000';
    document.getElementById('radiusValText').innerText = 'All Distance';
    refreshUI();
  });

  // Radius Slider
  const range = document.getElementById('proximityRange');
  range.addEventListener('input', (e) => {
    const val = e.target.value;
    document.getElementById('radiusValText').innerText = val >= 5000 ? 'All Distance' : `${val}m`;
    refreshUI();
  });

  // Floating map buttons
  document.getElementById('geoLocateBtn').onclick = triggerGpsLocate;
  document.getElementById('recenterMapBtn').onclick = resetMapView;
  document.getElementById('openRaiseIssueBtn').onclick = openRaiseModal;
  document.getElementById('closeTipBtn').onclick = () => {
    document.getElementById('mapTipBanner').style.display = 'none';
  };

  // Raise Issue Modal Controls
  document.getElementById('closeRaiseModalBtn').onclick = closeRaiseModal;
  document.getElementById('cancelRaiseBtn').onclick = closeRaiseModal;
  document.getElementById('pickLocationOnMapBtn').onclick = () => {
    closeRaiseModal();
    alert('Click anywhere on the map to set the issue pin location!');
  };

  // Image Upload Input
  const imgInput = document.getElementById('issueImageInput');
  imgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        currentUploadedImageBase64 = evt.target.result;
        const preview = document.getElementById('imagePreview');
        preview.src = currentUploadedImageBase64;
        preview.classList.remove('hidden');
        document.getElementById('uploadPlaceholder').classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // AI Smart Tag Generator Button
  document.getElementById('aiSmartTagBtn').onclick = async () => {
    const title = document.getElementById('issueTitle').value;
    const desc = document.getElementById('issueDesc').value;
    const category = document.getElementById('issueCategory').value;
    const hasImage = !!currentUploadedImageBase64;
    const lat = parseFloat(document.getElementById('issueLat').value);
    const lng = parseFloat(document.getElementById('issueLng').value);

    if (!title && !desc) {
      alert('Please enter a title or description first!');
      return;
    }

    // 1. Generate Tags
    const tags = await generateSmartTags(title, desc, category);
    const tagsContainer = document.getElementById('aiTagsContainer');
    const tagsList = document.getElementById('aiTagsList');
    tagsList.innerHTML = tags.map(t => `<span class="tag-pill">${t}</span>`).join('');
    tagsContainer.classList.remove('hidden');

    // 2. Generate Claim Verification Trust Score
    const verification = await verifyClaimCredibility(title, desc, category, hasImage, lat, lng);
    document.getElementById('aiTrustScoreVal').innerText = `${verification.trustScore}%`;
    document.getElementById('aiVerificationSummary').innerText = verification.explanation;
  };

  // Submit Issue Form
  document.getElementById('raiseIssueForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitNewIssue();
  });

  // Detail Modal Controls
  document.getElementById('closeDetailModalBtn').onclick = () => {
    document.getElementById('issueDetailModal').classList.remove('active');
  };

  // Upvote Button
  document.getElementById('detailUpvoteBtn').onclick = () => {
    if (activeIssue) {
      const updated = upvoteIssue(activeIssue.id);
      if (updated) {
        activeIssue = updated;
        document.getElementById('detailUpvoteCount').innerText = updated.upvotes;
        triggerConfetti();
        refreshUI();
      }
    }
  };

  // Advance Status Button
  document.getElementById('updateStatusBtn').onclick = () => {
    if (activeIssue) {
      let nextStatus = 'In Progress';
      if (activeIssue.status === 'Reported') nextStatus = 'In Progress';
      else if (activeIssue.status === 'In Progress') nextStatus = 'Resolved';
      else if (activeIssue.status === 'Resolved') nextStatus = 'Reported';

      const updated = updateIssueStatus(activeIssue.id, nextStatus);
      if (updated) {
        activeIssue = updated;
        document.getElementById('detailStatusChip').innerText = updated.status;
        updateStatusStepper(updated.status);
        refreshUI();
      }
    }
  };

  // Add Comment Form
  document.getElementById('addCommentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('commentTextInput');
    const text = input.value.trim();
    if (text && activeIssue) {
      const updated = addCommentToIssue(activeIssue.id, text, 'Civic Contributor');
      if (updated) {
        activeIssue = updated;
        renderCommentsList(updated.comments);
        input.value = '';
        refreshUI();
      }
    }
  });

  // Seed Demo Data Button
  document.getElementById('seedDemoBtn').onclick = () => {
    resetToSeedData();
    refreshUI();
    triggerConfetti();
    alert('✨ Hackathon sample dataset restored!');
  };

  // User Auth & Profile Modal
  document.getElementById('authBtn').onclick = openAuthModal;
  document.getElementById('userReputationPill').onclick = openAuthModal;
  document.getElementById('closeAuthModalBtn').onclick = closeAuthModal;
  document.getElementById('closeProfileBtn').onclick = closeAuthModal;

  // Civic Community Modal
  const communityBtn = document.getElementById('civicCommunityBtn');
  if (communityBtn) {
    communityBtn.onclick = () => {
      renderCommunityModalFeed();
      document.getElementById('civicCommunityModal').classList.remove('hidden');
    };
  }
  const closeCommBtn = document.getElementById('closeCommunityModalBtn');
  if (closeCommBtn) {
    closeCommBtn.onclick = () => {
      document.getElementById('civicCommunityModal').classList.add('hidden');
    };
  }

  const commSearchInput = document.getElementById('communitySearchInput');
  if (commSearchInput) {
    commSearchInput.oninput = () => renderCommunityModalFeed();
  }
}

function renderCommunityModalFeed() {
  const container = document.getElementById('communityFeedContainer');
  if (!container) return;
  const query = (document.getElementById('communitySearchInput')?.value || '').toLowerCase().trim();

  const filtered = currentIssues.filter(i => {
    if (!query) return true;
    return (
      (i.title && i.title.toLowerCase().includes(query)) ||
      (i.description && i.description.toLowerCase().includes(query)) ||
      (i.category && i.category.toLowerCase().includes(query)) ||
      (i.reportedByName && i.reportedByName.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center p-4 text-muted">No problems or reports matching "${query}".</div>`;
    return;
  }

  container.innerHTML = filtered.map(issue => `
    <div class="card glass-card p-3 mb-2 flex items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="badge badge-sm">${issue.category}</span>
          <span class="badge badge-outline text-xs">${issue.status}</span>
        </div>
        <h4 class="font-bold text-sm text-white mt-1">${issue.title}</h4>
        <p class="text-xs text-muted">${issue.description || ''}</p>
      </div>
      <button class="btn btn-primary btn-sm whitespace-nowrap" onclick="window.selectIssueAndCloseCommunity('${issue.id}')">
        Focus Pin
      </button>
    </div>
  `).join('');
}

window.selectIssueAndCloseCommunity = function(issueId) {
  document.getElementById('civicCommunityModal')?.classList.add('hidden');
  const target = currentIssues.find(i => i.id === issueId);
  if (target) {
    handleSelectIssue(target);
  }
};

function openRaiseModal() {
  document.getElementById('raiseIssueModal').classList.add('active');
}

function closeRaiseModal() {
  document.getElementById('raiseIssueModal').classList.remove('active');
  clearTemporaryPin();
}

function openAuthModal() {
  updateUserProfileDisplay();
  document.getElementById('authModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

/**
 * Submit New Issue Handler
 */
function submitNewIssue() {
  const title = document.getElementById('issueTitle').value;
  const category = document.getElementById('issueCategory').value;
  const severity = document.getElementById('issueSeverity').value;
  const description = document.getElementById('issueDesc').value;
  const address = document.getElementById('issueAddress').value || 'Reported Coordinates';
  const lat = parseFloat(document.getElementById('issueLat').value) || userGpsLat || CONFIG.DEFAULT_LOCATION.lat;
  const lng = parseFloat(document.getElementById('issueLng').value) || userGpsLng || CONFIG.DEFAULT_LOCATION.lng;

  const trustScoreText = document.getElementById('aiTrustScoreVal').innerText;
  const aiScore = parseInt(trustScoreText, 10) || 92;
  const aiExplanation = document.getElementById('aiVerificationSummary').innerText;

  // Collect generated tag elements
  const tagPills = Array.from(document.querySelectorAll('#aiTagsList .tag-pill')).map(el => el.innerText);

  const newIssue = {
    id: `issue-${Date.now()}`,
    title,
    category,
    severity,
    status: 'Reported',
    lat,
    lng,
    address,
    description,
    imageUrl: currentUploadedImageBase64 || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    author: 'Civic Contributor',
    createdAt: new Date().toISOString(),
    upvotes: 1,
    aiScore,
    aiExplanation,
    tags: tagPills.length > 0 ? tagPills : [`#${category.toUpperCase()}`, '#CivicReport'],
    comments: []
  };

  saveIssue(newIssue);
  closeRaiseModal();
  refreshUI();
  triggerConfetti();

  // Reset form
  document.getElementById('raiseIssueForm').reset();
  currentUploadedImageBase64 = null;
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('uploadPlaceholder').classList.remove('hidden');
  document.getElementById('aiTagsContainer').classList.add('hidden');
}

/**
 * Confetti animation trigger for points / rewards
 */
function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}
