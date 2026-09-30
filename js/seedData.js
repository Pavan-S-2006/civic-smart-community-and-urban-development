// Pre-populated seed issues dataset for hackathon presentation demo

export const INITIAL_SEED_ISSUES = [
  {
    id: "issue-101",
    title: "Hazardous Deep Pothole on 5th Avenue Crosswalk",
    category: "pothole",
    severity: "High",
    status: "Reported",
    lat: 40.7138,
    lng: -74.0080,
    address: "5th Ave & 23rd St, Manhattan, NY",
    description: "Large 8-inch deep pothole near the pedestrian crossing. Caused a tire burst on a delivery bicycle this morning. Poses severe danger to cyclists and motorbikes.",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    author: "Elena Rostova",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    upvotes: 42,
    aiScore: 96,
    aiExplanation: "High Reliability — Image matches asphalt road fracture patterns. Location coordinates confirmed via street layout cross-reference.",
    tags: ["#RoadHazard", "#Pothole", "#PedestrianSafety"],
    comments: [
      { id: "c1", author: "Marcus Vance", text: "Saw a cyclist almost flip over this yesterday! Needs urgent patch.", time: "3 hours ago" },
      { id: "c2", author: "City Public Works", text: "Ticket assigned to DOT Repair Crew #4. ETA 24 hours.", time: "1 hour ago" }
    ]
  },
  {
    id: "issue-102",
    title: "Major Water Pipe Leakage Flooding Sidewalk",
    category: "water",
    severity: "Critical",
    status: "In Progress",
    lat: 40.7180,
    lng: -74.0010,
    address: "Broadway & Broome St, Soho, NY",
    description: "Clean water gushing out from an underground main valve pipe. Water stream is pooling on the sidewalk and entering storefront basements.",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
    author: "David Chen",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
    upvotes: 87,
    aiScore: 98,
    aiExplanation: "Very High Reliability — Multiple independent user reports in 100m radius corroborating water main burst.",
    tags: ["#WaterLeakage", "#Infrastructure", "#UrgentUtility"],
    comments: [
      { id: "c3", author: "Sarah Jenkins", text: "Water pressure in nearby apartment building dropped drastically.", time: "12 hours ago" },
      { id: "c4", author: "Utility Dispatcher", text: "Emergency shutoff team dispatched to site.", time: "6 hours ago" }
    ]
  },
  {
    id: "issue-103",
    title: "Broken Streetlight Array at Park Avenue Park",
    category: "power",
    severity: "Medium",
    status: "Reported",
    lat: 40.7250,
    lng: -73.9950,
    address: "Park Ave & E 14th St, Union Square, NY",
    description: "Three consecutive streetlight poles are flickering violently and completely out. The pedestrian walkway is pitch dark at night.",
    imageUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    author: "Aisha Patel",
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(), // 30 hours ago
    upvotes: 29,
    aiScore: 91,
    aiExplanation: "High Reliability — Image metadata indicates nighttime exposure with zero ambient light rendering.",
    tags: ["#StreetlightOut", "#NightSafety", "#PublicLighting"],
    comments: [
      { id: "c5", author: "Aisha Patel", text: "Felt unsafe walking home last night. Hope power grid team fixes the fuses soon.", time: "1 day ago" }
    ]
  },
  {
    id: "issue-104",
    title: "Overflowing Public Waste Containers",
    category: "sanitation",
    severity: "Medium",
    status: "Resolved",
    lat: 40.7080,
    lng: -74.0120,
    address: "Wall St & Water St, Financial District, NY",
    description: "Garbage bins overflowing onto sidewalk, attracting pests and creating unpleasant odor near park benches.",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    author: "Carlos Ruiz",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    upvotes: 56,
    aiScore: 94,
    aiExplanation: "Verified Resolved — Sanitation truck #12 cleared trash and replaced bins at 09:30 AM.",
    tags: ["#Sanitation", "#CleanCity", "#WasteManagement"],
    comments: [
      { id: "c6", author: "Sanitation Dept", text: "Trash cleared and extra bin installed!", time: "4 hours ago" }
    ]
  },
  {
    id: "issue-105",
    title: "Damaged Pedestrian Crossing Signal",
    category: "traffic",
    severity: "High",
    status: "In Progress",
    lat: 40.7160,
    lng: -74.0040,
    address: "Chambers St & Centre St, Civic Center, NY",
    description: "Walk/Don't Walk signal light box hanging loosely from wires after wind storm. Poses risk of falling on pedestrians.",
    imageUrl: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=800&q=80",
    author: "Samantha Lee",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    upvotes: 34,
    aiScore: 92,
    aiExplanation: "High Reliability — Structural tilt detected in signal box image frame.",
    tags: ["#TrafficSignal", "#HazardousWire", "#PedestrianSafety"],
    comments: [
      { id: "c7", author: "Traffic Tech", text: "Bucket truck crew en route to secure fixture.", time: "2 hours ago" }
    ]
  },
  {
    id: "issue-106",
    title: "Broken Bench & Overgrown Vegetation in Community Garden",
    category: "safety",
    severity: "Low",
    status: "Reported",
    lat: 40.7220,
    lng: -73.9880,
    address: "Avenue B & E 6th St, East Village, NY",
    description: "Wooden park bench splintered and sharp nails sticking out. Needs board replacement and bush pruning.",
    imageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80",
    author: "Oliver Queen",
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    upvotes: 18,
    aiScore: 89,
    aiExplanation: "Moderate Reliability — Minor public park maintenance issue.",
    tags: ["#ParkMaintenance", "#CommunityGarden", "#PublicSafety"],
    comments: []
  }
];
