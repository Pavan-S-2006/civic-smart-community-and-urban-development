// Firebase Integration & Reactive Storage Service (with Auto LocalStorage Fallback)

import { CONFIG } from './config.js';
import { INITIAL_SEED_ISSUES } from './seedData.js';

const STORAGE_KEY = 'civicpulse_issues_v1';
const USER_KEY = 'civicpulse_user_v1';

let isFirebaseConnected = false;

// Default Demo User Profile
const DEFAULT_USER = {
  name: 'Civic Contributor',
  email: 'citizen@civicpulse.org',
  points: 150,
  reportsCount: 2,
  upvotesCount: 8,
  badges: ['Eagle Eye', 'Civic Hero', 'Master Verifier']
};

/**
 * Initializes Data Store
 */
export function initDataStore() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ISSUES));
  }

  const existingUser = localStorage.getItem(USER_KEY);
  if (!existingUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
  }
}

/**
 * Fetch all issues
 */
export function getIssues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_SEED_ISSUES;
  } catch (e) {
    console.warn('Storage fetch error:', e);
    return INITIAL_SEED_ISSUES;
  }
}

/**
 * Save new issue
 */
export function saveIssue(newIssue) {
  const issues = getIssues();
  issues.unshift(newIssue);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));

  // Award user points (+50 PTS)
  addPointsToUser(CONFIG.POINTS.REPORT_ISSUE);

  return newIssue;
}

/**
 * Increment upvotes
 */
export function upvoteIssue(issueId) {
  const issues = getIssues();
  const index = issues.findIndex(i => i.id === issueId);
  if (index !== -1) {
    issues[index].upvotes += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));

    // Award user points (+5 PTS)
    addPointsToUser(CONFIG.POINTS.UPVOTE_ISSUE);
    return issues[index];
  }
  return null;
}

/**
 * Update issue resolution lifecycle status
 */
export function updateIssueStatus(issueId, newStatus) {
  const issues = getIssues();
  const index = issues.findIndex(i => i.id === issueId);
  if (index !== -1) {
    issues[index].status = newStatus;

    if (newStatus === 'Resolved') {
      addPointsToUser(CONFIG.POINTS.RESOLVE_ISSUE);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    return issues[index];
  }
  return null;
}

/**
 * Add comment to issue
 */
export function addCommentToIssue(issueId, commentText, authorName = 'Civic Contributor') {
  const issues = getIssues();
  const index = issues.findIndex(i => i.id === issueId);
  if (index !== -1) {
    if (!issues[index].comments) issues[index].comments = [];

    const newComment = {
      id: 'c_' + Date.now(),
      author: authorName,
      text: commentText,
      time: 'Just now'
    };

    issues[index].comments.push(newComment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));

    // Award points (+10 PTS)
    addPointsToUser(CONFIG.POINTS.ADD_COMMENT);

    return issues[index];
  }
  return null;
}

/**
 * Get User Profile
 */
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch (e) {
    return DEFAULT_USER;
  }
}

/**
 * Add points to user
 */
export function addPointsToUser(pts) {
  const user = getUserProfile();
  user.points += pts;

  // Check for badge unlocks
  if (user.points >= 200 && !user.badges.includes('Pillar of City')) {
    user.badges.push('Pillar of City');
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/**
 * Reset dataset back to hackathon seed data
 */
export function resetToSeedData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ISSUES));
  localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
  return INITIAL_SEED_ISSUES;
}
