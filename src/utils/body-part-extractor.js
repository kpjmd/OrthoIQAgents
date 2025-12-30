/**
 * Body Part Extractor Utility
 *
 * Extracts anatomical location and sport/activity context from user queries
 * BEFORE sending prompts to LLM agents. This ensures agents focus on the correct
 * body part from the start of their analysis.
 */

/**
 * Extract body part from user query and case data
 * @param {string} query - The raw user query
 * @param {Object} caseData - Structured case data (may contain bodyPart, affectedArea, location, etc.)
 * @returns {string|null} - Capitalized body part name or null if not found
 */
export function extractBodyPartFromQuery(query, caseData = {}) {
  // First, check if body part is explicitly provided in structured data
  if (caseData.bodyPart) {
    return capitalizeBodyPart(caseData.bodyPart);
  }
  if (caseData.affectedArea) {
    return capitalizeBodyPart(caseData.affectedArea);
  }
  if (caseData.location) {
    return capitalizeBodyPart(caseData.location);
  }

  // If no structured data, extract from raw query
  if (!query) return null;

  const bodyPartPatterns = {
    'elbow': ['elbow', 'elbows', 'elbow joint'],
    'shoulder': ['shoulder', 'shoulders', 'rotator cuff', 'deltoid'],
    'wrist': ['wrist', 'wrists', 'carpal', 'scaphoid'],
    'hand': ['hand', 'hands', 'palm', 'metacarpal'],
    'finger': ['finger', 'fingers', 'thumb', 'digit'],
    'hip': ['hip', 'hips', 'hip joint', 'pelvis', 'pelvic'],
    'knee': ['knee', 'knees', 'patella', 'kneecap'],
    'ankle': ['ankle', 'ankles', 'talus'],
    'foot': ['foot', 'feet', 'plantar', 'heel', 'metatarsal'],
    'back': ['back', 'spine', 'lumbar', 'thoracic', 'spinal'],
    'neck': ['neck', 'cervical spine', 'c-spine'],
    'chest': ['chest', 'rib', 'ribs', 'sternum', 'thorax'],
    'abdomen': ['abdomen', 'abdominal', 'stomach'],
    'groin': ['groin', 'adductor', 'pubic']
  };

  const lowerQuery = query.toLowerCase();

  // Check each body part pattern
  for (const [part, terms] of Object.entries(bodyPartPatterns)) {
    for (const term of terms) {
      if (lowerQuery.includes(term)) {
        return capitalizeBodyPart(part);
      }
    }
  }

  // Try to extract from common injury patterns
  const injuryPatterns = {
    'dislocation': extractFromInjuryPattern(lowerQuery, 'dislocat'),
    'fracture': extractFromInjuryPattern(lowerQuery, 'fracture'),
    'sprain': extractFromInjuryPattern(lowerQuery, 'sprain'),
    'strain': extractFromInjuryPattern(lowerQuery, 'strain'),
    'tear': extractFromInjuryPattern(lowerQuery, 'tear'),
    'pain': extractFromInjuryPattern(lowerQuery, 'pain')
  };

  for (const [pattern, result] of Object.entries(injuryPatterns)) {
    if (result) return result;
  }

  return null;
}

/**
 * Extract sport or activity from user query
 * @param {string} query - The raw user query
 * @returns {string|null} - Sport/activity name or null if not found
 */
export function extractSportActivity(query) {
  if (!query) return null;

  const sportPatterns = {
    'football': ['football', 'soccer'],
    'basketball': ['basketball', 'hoops'],
    'baseball': ['baseball', 'pitcher', 'pitching', 'batting'],
    'tennis': ['tennis'],
    'running': ['running', 'jogging', 'runner', 'marathon'],
    'cycling': ['cycling', 'biking', 'cyclist', 'bike'],
    'swimming': ['swimming', 'swimmer', 'swim'],
    'volleyball': ['volleyball'],
    'hockey': ['hockey'],
    'golf': ['golf', 'golfing', 'golfer'],
    'wrestling': ['wrestling', 'wrestler'],
    'gymnastics': ['gymnastics', 'gymnast'],
    'weightlifting': ['weightlifting', 'powerlifting', 'lifting weights'],
    'crossfit': ['crossfit', 'cross fit'],
    'yoga': ['yoga'],
    'climbing': ['climbing', 'rock climbing', 'bouldering']
  };

  const lowerQuery = query.toLowerCase();

  for (const [sport, terms] of Object.entries(sportPatterns)) {
    for (const term of terms) {
      if (lowerQuery.includes(term)) {
        return capitalizeSport(sport);
      }
    }
  }

  // Check for generic "sport" or "athletic" mentions
  if (lowerQuery.includes('sport') || lowerQuery.includes('athletic') || lowerQuery.includes('athlete')) {
    return 'Athletic Activity';
  }

  return null;
}

/**
 * Helper function to extract body part from injury pattern
 * Example: "elbow dislocation" -> extract "elbow"
 */
function extractFromInjuryPattern(lowerQuery, injuryKeyword) {
  const bodyParts = ['elbow', 'shoulder', 'wrist', 'hand', 'finger', 'hip', 'knee', 'ankle', 'foot', 'back', 'neck'];

  for (const part of bodyParts) {
    // Check for pattern: "bodypart injury" or "injury bodypart"
    const pattern1 = new RegExp(`${part}\\s+\\w*${injuryKeyword}`, 'i');
    const pattern2 = new RegExp(`${injuryKeyword}\\w*\\s+\\w*${part}`, 'i');

    if (pattern1.test(lowerQuery) || pattern2.test(lowerQuery)) {
      return capitalizeBodyPart(part);
    }
  }

  return null;
}

/**
 * Capitalize body part name consistently
 */
function capitalizeBodyPart(part) {
  if (!part) return null;
  const lower = part.toLowerCase().trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Capitalize sport name consistently
 */
function capitalizeSport(sport) {
  if (!sport) return null;
  const lower = sport.toLowerCase().trim();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Get body-part-specific dysfunction patterns for movement analysis
 * @param {string} bodyPart - The body part to analyze
 * @returns {Object} - Pattern definitions for the specified body part
 */
export function getBodyPartSpecificPatterns(bodyPart) {
  if (!bodyPart) return {};

  const bp = bodyPart.toLowerCase();

  const patternDefinitions = {
    'elbow': {
      'elbow_instability': ['instability', 'dislocation', 'subluxation', 'laxity'],
      'UCL_injury': ['UCL', 'ulnar collateral', 'medial elbow', 'tommy john'],
      'lateral_epicondylitis': ['tennis elbow', 'lateral epicondylitis', 'lateral pain'],
      'medial_epicondylitis': ['golfer elbow', 'medial epicondylitis', 'medial pain'],
      'elbow_stiffness': ['stiffness', 'limited range', 'flexion contracture', 'extension loss'],
      'valgus_instability': ['valgus', 'medial instability', 'valgus stress'],
      'pronation_supination_deficit': ['rotation loss', 'pronation deficit', 'supination deficit']
    },
    'shoulder': {
      'rotator_cuff_dysfunction': ['rotator cuff', 'supraspinatus', 'infraspinatus'],
      'impingement_pattern': ['impingement', 'subacromial', 'painful arc'],
      'anterior_instability': ['instability', 'dislocation', 'apprehension'],
      'scapular_dyskinesis': ['scapular', 'winging', 'dyskinesis'],
      'rounded_shoulders': ['rounded shoulders', 'protracted shoulders']
    },
    'hip': {
      'hip_flexor_tightness': ['hip flexor tight', 'tight hip flexor', 'iliopsoas'],
      'weak_hip_abductors': ['weak hip abductor', 'weak glute', 'weak gluteal'],
      'FAI_pattern': ['impingement', 'FAI', 'femoroacetabular'],
      'hip_drop': ['hip drop', 'trendelenburg', 'pelvic drop'],
      'hip_instability': ['hip instability', 'hip laxity'],
      'hip_muscle_imbalance': ['muscle imbalance', 'asymmetric strength']
    },
    'knee': {
      'valgus_collapse': ['valgus', 'knee collapse', 'medial collapse'],
      'patellar_tracking': ['patella', 'kneecap', 'tracking', 'maltracking'],
      'quad_weakness': ['quad weak', 'quadriceps weak', 'VMO'],
      'ACL_pattern': ['ACL', 'anterior cruciate', 'instability'],
      'meniscus_pattern': ['meniscus', 'locking', 'catching']
    },
    'ankle': {
      'ankle_instability': ['instability', 'giving way', 'rolling'],
      'limited_dorsiflexion': ['dorsiflexion', 'ankle stiff', 'limited ankle'],
      'peroneal_weakness': ['peroneal weak', 'eversion weak'],
      'calf_tightness': ['calf tight', 'gastrocnemius', 'soleus']
    },
    'back': {
      'excessive_lordosis': ['lordosis', 'excessive lumbar curve', 'anterior pelvic tilt'],
      'posterior_pelvic_tilt': ['posterior tilt', 'flat back'],
      'lateral_shift': ['lateral shift', 'list', 'scoliosis'],
      'restricted_mobility': ['stiff', 'limited flexion', 'limited extension']
    },
    'neck': {
      'anterior_head_posture': ['forward head', 'anterior head'],
      'reduced_cervical_curve': ['straight neck', 'loss of lordosis'],
      'rotation_asymmetry': ['rotation limited', 'asymmetric rotation']
    },
    'wrist': {
      'wrist_instability': ['instability', 'TFCC', 'scapholunate'],
      'limited_extension': ['extension limited', 'wrist stiff'],
      'ulnar_deviation': ['ulnar deviation', 'ulnar sided pain'],
      'carpal_tunnel_pattern': ['carpal tunnel', 'median nerve', 'numbness']
    }
  };

  return patternDefinitions[bp] || {};
}

/**
 * Extract injury timeline from user query and case data
 * @param {string} query - The raw user query
 * @param {Object} caseData - Structured case data (may contain duration, onset, etc.)
 * @returns {Object|null} - { value, unit, phase, totalDays } or null if not found
 */
export function extractTimeline(query, caseData = {}) {
  // First check structured data
  if (caseData.duration) {
    return parseTimelineString(caseData.duration);
  }

  if (!query) return null;

  // Timeline patterns to search for
  const timePatterns = [
    // "3 weeks ago", "2 days ago", "6 months ago"
    /(\d+)\s+(hour|hours|day|days|week|weeks|month|months|year|years)\s+ago/i,
    // "for 3 weeks", "since 2 days"
    /(?:for|since)\s+(\d+)\s+(hour|hours|day|days|week|weeks|month|months)/i,
    // "last week", "yesterday"
    /(yesterday|last\s+week|last\s+month)/i
  ];

  for (const pattern of timePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes('yesterday')) {
        return {
          value: 1,
          unit: 'day',
          phase: 'Acute',
          totalDays: 1
        };
      }
      if (match[0].toLowerCase().includes('last week')) {
        return {
          value: 1,
          unit: 'week',
          phase: 'Inflammatory',
          totalDays: 7
        };
      }
      if (match[0].toLowerCase().includes('last month')) {
        return {
          value: 1,
          unit: 'month',
          phase: 'Late Proliferation',
          totalDays: 30
        };
      }

      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase().replace(/s$/, ''); // Remove plural 's'

      return {
        value,
        unit,
        phase: determineRecoveryPhase(value, unit),
        totalDays: convertToDays(value, unit)
      };
    }
  }

  return null;
}

/**
 * Parse timeline string like "3 weeks" or "2 days"
 */
function parseTimelineString(timeStr) {
  const match = timeStr.match(/(\d+)\s+(hour|hours|day|days|week|weeks|month|months|year|years)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase().replace(/s$/, '');
    return {
      value,
      unit,
      phase: determineRecoveryPhase(value, unit),
      totalDays: convertToDays(value, unit)
    };
  }
  return null;
}

/**
 * Determine recovery phase based on timeline
 */
function determineRecoveryPhase(value, unit) {
  const days = convertToDays(value, unit);

  if (days <= 3) return 'Acute';
  if (days <= 14) return 'Inflammatory';
  if (days <= 42) return 'Early Proliferation';
  if (days <= 84) return 'Late Proliferation';
  return 'Remodeling';
}

/**
 * Convert timeline to days
 */
function convertToDays(value, unit) {
  const conversions = {
    'hour': 1 / 24,
    'day': 1,
    'week': 7,
    'month': 30,
    'year': 365
  };
  return Math.round(value * (conversions[unit] || 1));
}

/**
 * Extract injury mechanism from user query
 * @param {string} query - The raw user query
 * @param {Object} caseData - Structured case data
 * @returns {string|null} - Injury mechanism or null if not found
 */
export function extractInjuryMechanism(query, caseData = {}) {
  // Check structured data first
  if (caseData.injuryMechanism) {
    return caseData.injuryMechanism;
  }

  if (!query) return null;

  const lowerQuery = query.toLowerCase();

  const mechanismPatterns = {
    'twist': ['twist', 'twisted', 'twisting', 'rotational', 'rotating'],
    'direct_blow': ['hit', 'struck', 'direct blow', 'impact', 'collision', 'tackled'],
    'fall': ['fall', 'fell', 'fallen', 'tripped', 'slipped'],
    'hyperextension': ['hyperextend', 'hyperextension', 'bent back', 'straightened too far'],
    'hyperflexion': ['hyperflexion', 'bent forward too far', 'bent too much'],
    'overuse': ['overuse', 'repetitive', 'gradual', 'chronic', 'developed over time'],
    'valgus_stress': ['valgus', 'knocked inward', 'knee gave inward'],
    'varus_stress': ['varus', 'knocked outward'],
    'compression': ['compression', 'compressed', 'squashed', 'crushed'],
    'traction': ['pulled', 'yanked', 'traction', 'stretched'],
    'dislocation': ['dislocated', 'dislocation', 'popped out']
  };

  for (const [mechanism, terms] of Object.entries(mechanismPatterns)) {
    if (terms.some(term => lowerQuery.includes(term))) {
      return mechanism;
    }
  }

  return null;
}

/**
 * Extract injury context (environment, activity, etc.)
 * @param {string} query - The raw user query
 * @returns {string|null} - Context description or null
 */
export function extractInjuryContext(query) {
  if (!query) return null;

  const lowerQuery = query.toLowerCase();

  const contextPatterns = {
    'wet_floor': ['wet floor', 'slippery', 'wet surface'],
    'stairs': ['stairs', 'step', 'steps'],
    'sports': ['playing', 'game', 'match', 'practice', 'training'],
    'lifting': ['lifting', 'carrying', 'picking up'],
    'running': ['running', 'jogging', 'sprinting'],
    'jumping': ['jumping', 'landing', 'jumped']
  };

  const contexts = [];
  for (const [context, terms] of Object.entries(contextPatterns)) {
    if (terms.some(term => lowerQuery.includes(term))) {
      contexts.push(context);
    }
  }

  return contexts.length > 0 ? contexts.join(', ') : null;
}
