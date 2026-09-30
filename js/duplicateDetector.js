// Proximity Duplicate Detection Engine for Civic Issues

/**
 * Calculates straight-line distance between two GPS coordinates in meters (Haversine Formula)
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Checks existing issues list for any reports near (lat, lng) within radiusMeters.
 * Returns match details if duplicate found, or null if clear.
 */
export function findDuplicateIssue(lat, lng, category, titleText, existingIssues, radiusMeters = 150) {
  if (!lat || !lng || !existingIssues || existingIssues.length === 0) return null;

  for (const issue of existingIssues) {
    // Only compare against active (unresolved or in-progress) issues
    if (issue.status === "Resolved") continue;

    const distance = calculateDistanceMeters(lat, lng, issue.lat, issue.lng);

    if (distance <= radiusMeters) {
      // If within 150m and matches category OR shares title keywords
      const sameCategory = (issue.category === category);
      const sharesKeywords = titleText ? checkKeywordOverlap(titleText, issue.title) : false;

      if (sameCategory || sharesKeywords) {
        return {
          duplicateFound: true,
          issue: issue,
          distanceMeters: distance
        };
      }
    }
  }

  return null;
}

function checkKeywordOverlap(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const common = words1.filter(w => words2.includes(w));
  return common.length >= 1;
}
