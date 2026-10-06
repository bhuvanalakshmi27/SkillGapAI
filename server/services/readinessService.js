function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeSkillReadiness(gapSkills) {
  if (!gapSkills.length) return { score: null, detail: "Run skill gap analysis to compute skill readiness." };

  const assessed = gapSkills.filter((skill) => skill.currentLevel !== null);
  if (!assessed.length) {
    return { score: null, detail: "Complete self-assessments and mini tests to calculate skill readiness." };
  }
  const meeting = gapSkills.filter((skill) => skill.status === "Meets Requirement").length;
  const coverage = assessed.length / gapSkills.length;
  const meetRatio = meeting / gapSkills.length;
  const score = Math.round((meetRatio * 0.7 + coverage * 0.3) * 100);

  return {
    score,
    detail: `${meeting} of ${gapSkills.length} required skills meet the target level; ${assessed.length} skills have confidence data.`,
  };
}

function computeAssessmentCoverage(gapSkills, testCount) {
  if (!gapSkills.length) return { score: null, detail: "No role skills to assess yet." };

  const assessed = gapSkills.filter((skill) => skill.currentLevel !== null).length;
  if (!assessed) {
    return { score: null, detail: `No role skills have confidence data yet; ${testCount} mini test submission(s) on record.` };
  }
  const score = Math.round((assessed / gapSkills.length) * 100);

  return {
    score,
    detail: `${assessed} role skills assessed via confidence; ${testCount} mini test submission(s) on record.`,
  };
}

function computeProjectEvidenceScore(projects) {
  if (!projects.length) return { score: null, detail: "No project evidence added yet (supporting signal only)." };

  const completed = projects.filter((project) => project.status === "completed").length;
  const withLinks = projects.filter((project) => project.githubUrl || project.liveDemoUrl).length;
  const raw = (completed / projects.length) * 60 + (withLinks / projects.length) * 40;
  const score = Math.round(clamp(raw, 0, 100));

  return {
    score,
    detail: `${completed} completed project(s) and ${withLinks} with demo/repo links (evidence, not mastery proof).`,
  };
}

function computeResumeReadiness(latestResume) {
  if (!latestResume) return { score: null, detail: "Upload a resume to evaluate resume readiness." };

  const represented = latestResume.representedSkills?.length || 0;
  const missing = latestResume.skillsNotClearlyRepresented?.length || 0;
  const total = represented + missing;
  const score = total > 0 ? Math.round((represented / total) * 100) : null;

  return {
    score,
    detail: `${represented} profile skills clearly represented; ${missing} not clearly represented on resume.`,
  };
}

function computeLearningProgress(roadmap) {
  if (!roadmap) return { score: null, detail: "Generate a personalized roadmap to track learning progress." };

  return {
    score: roadmap.progressPercentage ?? 0,
    detail: `${roadmap.progressPercentage ?? 0}% of weekly roadmap modules marked complete.`,
  };
}

function computeOverallReadiness(sections) {
  const weights = {
    skillReadiness: 0.35,
    assessmentCoverage: 0.2,
    projectEvidence: 0.15,
    resumeReadiness: 0.15,
    learningProgress: 0.15,
  };

  let weightedSum = 0;
  let weightTotal = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    const sectionScore = sections[key]?.score;
    if (typeof sectionScore === "number") {
      weightedSum += sectionScore * weight;
      weightTotal += weight;
    }
  });

  if (weightTotal === 0) return null;

  return Math.round(weightedSum / weightTotal);
}

function buildReadinessPayload({ gapSkills, testCount, projects, latestResume, roadmap }) {
  const sections = {
    skillReadiness: computeSkillReadiness(gapSkills),
    assessmentCoverage: computeAssessmentCoverage(gapSkills, testCount),
    projectEvidence: computeProjectEvidenceScore(projects),
    resumeReadiness: computeResumeReadiness(latestResume),
    learningProgress: computeLearningProgress(roadmap),
  };

  const essentialDataComplete = gapSkills.length > 0
    && gapSkills.every((skill) => skill.currentLevel !== null)
    && testCount > 0;
  const overall = essentialDataComplete ? computeOverallReadiness(sections) : null;

  const strengths = [];
  const priorities = [];
  const priorityGaps = gapSkills
    .filter((skill) => skill.status === "Gap")
    .sort((left, right) => (right.gap ?? 0) - (left.gap ?? 0))
    .slice(0, 5)
    .map((skill) => ({
      skill: skill.skillName,
      currentLevel: skill.currentLevel,
      requiredLevel: skill.requiredLevel,
      gap: skill.gap,
      priority: skill.priority,
    }));

  Object.entries(sections).forEach(([key, section]) => {
    if (typeof section.score === "number" && section.score >= 70) {
      strengths.push({ area: key, score: section.score, detail: section.detail });
    }
    if (typeof section.score === "number" && section.score < 50) {
      priorities.push({ area: key, score: section.score, detail: section.detail });
    }
  });

  const recommendedNextActions = [];
  if (!gapSkills.length) {
    recommendedNextActions.push("Run Skill Gap Analysis for your saved target role.");
  }
  if (gapSkills.length && gapSkills.some((skill) => skill.currentLevel === null)) {
    recommendedNextActions.push("Complete self-assessments and mini tests for every required role skill.");
  }
  if (!testCount) {
    recommendedNextActions.push("Complete at least one mini skill test before using the readiness indicator.");
  }
  if (sections.assessmentCoverage.score !== null && sections.assessmentCoverage.score < 100) {
    recommendedNextActions.push("Complete mini skill tests for unassessed role skills.");
  }
  if (sections.learningProgress.score !== null && sections.learningProgress.score < 100) {
    recommendedNextActions.push("Continue your weekly roadmap module and mark completed tasks.");
  }
  if (!latestResume) {
    recommendedNextActions.push("Run a resume analysis to align your CV with your target role.");
  }
  if (priorities.some((item) => item.area === "skillReadiness")) {
    recommendedNextActions.push("Focus on high-priority skill gaps from your latest analysis.");
  }
  if (projects.length === 0) {
    recommendedNextActions.push("Add project evidence to support your skill profile.");
  }

  return {
    overallReadiness: overall,
    disclaimer:
      "This is a preparation indicator based on your recorded activity and assessments—not a job guarantee.",
    formulaExplanation:
      "Overall readiness is a weighted average: Skill Readiness 35%, Assessment Coverage 20%, Project Evidence 15%, Resume Readiness 15%, Learning Progress 15%. Sections with no data are excluded from the average.",
    sections,
    strengths,
    priorityImprovementAreas: priorities,
    priorityGaps,
    recommendedNextActions: recommendedNextActions.slice(0, 5),
    readinessAvailable: essentialDataComplete,
    readinessStatus: essentialDataComplete
      ? "Calculated from complete required-skill confidence data."
      : "Career readiness cannot be calculated yet. Complete skill assessments and mini tests for your target role.",
  };
}

module.exports = {
  buildReadinessPayload,
};
