import { collection, addDoc, serverTimestamp, getDocs, limit, query } from 'firebase/firestore';
import { db } from './index';

export const SAMPLE_ISSUES = [
  {
    title: 'Hazardous Deep Pothole on Outer Ring Road',
    description: 'Severe 10-inch deep pothole near Nehru Place flyover causing severe vehicle damage and traffic bottleneck during peak hours.',
    category: 'Pothole',
    lat: 28.5494,
    lng: 77.2501,
    status: 'In Progress',
    upvotes: 14,
    upvotedBy: ['user_demo_1', 'user_demo_2', 'user_demo_3'],
    reportedByName: 'Aarav Sharma (Verified Citizen)',
    reliabilityScore: 'High (Verified by 14 local citizens)',
    photoURL: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    commentCount: 4,
  },
  {
    title: 'Severe Storm Drain Overflow & Waterlogging',
    description: 'Clogged drainage grate causing 1-foot deep standing water near Connaught Place Outer Circle after recent monsoon rain.',
    category: 'Flooding',
    lat: 28.6328,
    lng: 77.2197,
    status: 'Reported',
    upvotes: 22,
    upvotedBy: ['user_demo_4', 'user_demo_5'],
    reportedByName: 'Priya Patel',
    reliabilityScore: 'High (Community Flagged)',
    photoURL: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80',
    commentCount: 6,
  },
  {
    title: 'Broken Streetlight Array near Transit Metro Gate 2',
    description: 'Dark alley section with 4 consecutive non-functional streetlights creating safety concerns for night commuters.',
    category: 'Streetlight',
    lat: 28.6129,
    lng: 77.2295,
    status: 'In Progress',
    upvotes: 9,
    upvotedBy: ['user_demo_6'],
    reportedByName: 'Rohan Gupta',
    reliabilityScore: 'Medium Reliability',
    photoURL: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80',
    commentCount: 2,
  },
  {
    title: 'Illegal Waste Dump Overflowing in Residential Park',
    description: 'Uncollected municipal garbage pile spreading onto public footpath. Needs immediate sanitation truck dispatch.',
    category: 'Garbage',
    lat: 28.5921,
    lng: 77.2270,
    status: 'Resolved',
    upvotes: 31,
    upvotedBy: ['user_demo_7', 'user_demo_8'],
    reportedByName: 'Civic Watchdog NGO',
    reliabilityScore: 'High (Verified & Resolved)',
    photoURL: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    commentCount: 8,
  },
  {
    title: 'Public Bus Shelter Vandalism & Damaged Glass Panel',
    description: 'Shattered side panel glass poses physical hazard to waiting passengers near ITPO gate.',
    category: 'Vandalism',
    lat: 28.6180,
    lng: 77.2430,
    status: 'Reported',
    upvotes: 5,
    upvotedBy: ['user_demo_9'],
    reportedByName: 'Vikram Singh',
    reliabilityScore: 'Pending Verification',
    photoURL: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    commentCount: 1,
  },
  {
    title: 'Unmarked Open Utility Cable Trench',
    description: 'Uncovered telecom conduit trench left open without safety cones near primary school entrance.',
    category: 'Other',
    lat: 28.5672,
    lng: 77.2100,
    status: 'Reported',
    upvotes: 18,
    upvotedBy: ['user_demo_10'],
    reportedByName: 'Meera Deshmukh',
    reliabilityScore: 'High Reliability',
    photoURL: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80',
    commentCount: 3,
  }
];

/**
 * Seed realistic sample issues into Firestore if empty or triggered on-demand.
 */
export async function seedDemoIssues(force = false) {
  try {
    const colRef = collection(db, 'issues');
    if (!force) {
      const snap = await getDocs(query(colRef, limit(1)));
      if (!snap.empty) {
        return { success: true, seeded: 0, message: 'Database already contains issues.' };
      }
    }

    let count = 0;
    for (const sample of SAMPLE_ISSUES) {
      await addDoc(colRef, {
        ...sample,
        createdAt: serverTimestamp(),
      });
      count++;
    }
    return { success: true, seeded: count, message: `Successfully seeded ${count} sample issues!` };
  } catch (err) {
    console.error('Failed to seed issues:', err);
    return { success: false, error: err.message };
  }
}
