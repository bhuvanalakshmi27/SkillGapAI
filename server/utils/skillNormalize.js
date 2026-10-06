const SKILL_ALIASES = {
  "html/css": ["html", "css", "html/css", "responsive design"],
  "javascript/node.js": ["javascript", "node.js", "javascript/node.js", "express.js", "express"],
  "git/github": ["git", "github", "git/github"],
  "databases": ["databases", "sql", "mongodb", "postgresql", "mysql"],
  "power bi/tableau": ["power bi", "tableau", "power bi/tableau"],
  "infrastructure as code": ["infrastructure as code", "terraform", "cloudformation", "ansible"],
  "object-oriented programming": ["object-oriented programming", "oop", "java", "python", "cpp", "c++"],
  "cloud platforms": ["cloud platforms", "aws", "azure", "gcp", "cloud engineering"],
};

function normalizeSkill(name) {
  if (!name || typeof name !== "string") return "";
  return name.trim().toLowerCase();
}

/**
 * Returns a list of canonical candidate skill keys for a given skill name.
 * e.g. "JavaScript/Node.js" -> ["javascript/node.js", "javascript", "node.js", "express.js"]
 */
function getSkillCandidates(skillName) {
  const norm = normalizeSkill(skillName);
  if (!norm) return [];

  const candidates = new Set([norm]);

  // Split on slash or comma
  if (norm.includes("/")) {
    norm.split("/").forEach((part) => candidates.add(part.trim()));
  }

  // Check alias lookup
  for (const [key, aliasList] of Object.entries(SKILL_ALIASES)) {
    if (norm === key || aliasList.includes(norm)) {
      candidates.add(key);
      aliasList.forEach((alias) => candidates.add(alias));
    }
  }

  return Array.from(candidates);
}

function skillsMatch(left, right) {
  const leftCandidates = new Set(getSkillCandidates(left));
  return getSkillCandidates(right).some((candidate) => leftCandidates.has(candidate));
}

/**
 * Given a required skill name and a Map or Object of student skill scores (keyed by skill name),
 * returns the best matching score (0-100) or null if unassessed.
 */
function findBestSkillScore(requiredSkillName, confidenceMap) {
  if (!confidenceMap) return null;

  // Build a normalized map of student confidence: normalizedKey -> score
  const normalizedConfidenceMap = new Map();
  if (confidenceMap instanceof Map) {
    for (const [key, val] of confidenceMap.entries()) {
      normalizedConfidenceMap.set(normalizeSkill(key), val);
    }
  } else {
    for (const key of Object.keys(confidenceMap)) {
      normalizedConfidenceMap.set(normalizeSkill(key), confidenceMap[key]);
    }
  }

  const candidates = getSkillCandidates(requiredSkillName);

  let bestScore = null;
  for (const candidate of candidates) {
    if (normalizedConfidenceMap.has(candidate)) {
      const score = normalizedConfidenceMap.get(candidate);
      if (score !== null && score !== undefined) {
        if (bestScore === null || score > bestScore) {
          bestScore = score;
        }
      }
    }
  }

  return bestScore;
}

module.exports = {
  normalizeSkill,
  getSkillCandidates,
  skillsMatch,
  findBestSkillScore,
};
