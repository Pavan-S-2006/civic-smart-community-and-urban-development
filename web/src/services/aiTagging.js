/**
 * AI Auto-Tagging & Civic Official Dispatch Generator Service
 * Powered by Google Gemini / Generative AI API
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '';


/**
 * Generate AI suggestions for issue tagging, recommended civic department,
 * target municipal personnel tags, and recommended workflow step notes.
 */
export async function generateAITagsAndSuggestions({ title, description, category }) {
  if (!API_KEY) {
    // Return high-quality rule-based fallback when key is not yet set
    return getFallbackSuggestions({ title, description, category });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const prompt = `You are CivicPulse AI, an intelligent municipal triage system.
Analyze this civic issue report:
Title: "${title}"
Category: "${category}"
Description: "${description}"

Generate a JSON object with:
1. "tags": Array of 3-4 short hashtag strings (e.g. ["#RoadHazard", "#PotholeRepair", "#NehruPlace"])
2. "department": Recommended municipal department (e.g. "Public Works Dept (PWD)", "Municipal Corporation (MCD)", "Delhi Jal Board", "Traffic Police")
3. "taggedPersonnel": Array of 2-3 civic official role tags (e.g. ["@PWD_WardOfficer", "@ZoneEngineer", "@TrafficControl"])
4. "priority": "High" | "Medium" | "Low"
5. "suggestedAction": 1 short sentence on next action for the Report → Verify → Tag → Discuss → Track workflow.

Respond strictly in raw JSON without markdown formatting.`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.warn('Gemini API call failed, using smart fallback.');
      return getFallbackSuggestions({ title, description, category });
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      success: true,
      aiGenerated: true,
      tags: parsed.tags || [],
      department: parsed.department || 'Municipal Public Works',
      taggedPersonnel: parsed.taggedPersonnel || ['@ZoneOfficer', '@CivicWatch'],
      priority: parsed.priority || 'Medium',
      suggestedAction: parsed.suggestedAction || 'Verify upvotes and dispatch ward inspector.',
    };
  } catch (err) {
    console.error('Error generating AI suggestions:', err);
    return getFallbackSuggestions({ title, description, category });
  }
}

function getFallbackSuggestions({ title, description, category }) {
  const catMap = {
    'Pothole': {
      tags: ['#RoadHazard', '#PotholeFix', '#PublicSafety'],
      department: 'Public Works Department (PWD)',
      taggedPersonnel: ['@PWD_ChiefEngineer', '@WardInspector', '@TrafficSafetyOfficer'],
      priority: 'High',
      suggestedAction: 'Verify via 3+ community upvotes, then tag @PWD_ChiefEngineer for immediate patching.',
    },
    'Flooding': {
      tags: ['#DrainageOverflow', '#MonsoonAlert', '#CleanWaterways'],
      department: 'Delhi Jal Board & MCD Sanitation',
      taggedPersonnel: ['@JalBoard_Drainage', '@ZoneSanitationOfficer', '@DisasterMgmt'],
      priority: 'High',
      suggestedAction: 'Tag @JalBoard_Drainage for storm suction pumps & post update in Jukebox.',
    },
    'Streetlight': {
      tags: ['#NightSafety', '#StreetlightRepair', '#DarkAlley'],
      department: 'Municipal Electricity Board (BSES/TPDDL)',
      taggedPersonnel: ['@ElectricalEngineer', '@NightPatrolOfficer'],
      priority: 'Medium',
      suggestedAction: 'Tag @ElectricalEngineer to schedule bulb replacement & track status.',
    },
    'Garbage': {
      tags: ['#CleanCity', '#GarbagePile', '#SanitationNow'],
      department: 'Municipal Corporation Sanitation Division',
      taggedPersonnel: ['@MCD_SanitationLead', '@CleanZoneSupervisor'],
      priority: 'Medium',
      suggestedAction: 'Tag @MCD_SanitationLead for compactor truck dispatch.',
    },
    'Vandalism': {
      tags: ['#PublicProperty', '#VandalismReport', '#BusShelterSafety'],
      department: 'Civic Infrastructure & Local Ward Office',
      taggedPersonnel: ['@WardCouncillor', '@LocalPoliceStation'],
      priority: 'Low',
      suggestedAction: 'Tag @WardCouncillor & file repair request in tracking log.',
    },
  };

  const fallback = catMap[category] || {
    tags: ['#CivicPulse', '#PublicIssue', '#CityWatch'],
    department: 'General Municipal Administration',
    taggedPersonnel: ['@CivicHelpdesk', '@ZoneSupervisor'],
    priority: 'Medium',
    suggestedAction: 'Gather community upvotes to boost verification reliability score.',
  };

  return {
    success: true,
    aiGenerated: false,
    ...fallback,
  };
}
