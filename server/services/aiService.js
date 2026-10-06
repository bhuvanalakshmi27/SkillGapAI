const AI_UNAVAILABLE_MESSAGE =
  "AI generation is currently unavailable. Please check the Gemini API configuration or free-tier quota.";

const AI_NOT_CONFIGURED = AI_UNAVAILABLE_MESSAGE;

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error(AI_UNAVAILABLE_MESSAGE);
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  };
}

function parseJsonResponse(text) {
  const normalized = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(normalized);
  } catch {
    const error = new Error("Gemini returned a malformed JSON response.");
    error.code = "AI_MALFORMED_RESPONSE";
    throw error;
  }
}

function getErrorCode(status) {
  if (status === 401) return "AI_INVALID_KEY";
  if (status === 400) return "AI_INVALID_REQUEST";
  if (status === 403) return "AI_ACCESS_DENIED";
  if (status === 404) return "AI_MODEL_UNAVAILABLE";
  if (status === 429) return "AI_QUOTA_EXCEEDED";
  if (status >= 500) return "AI_TEMPORARY_FAILURE";
  return "AI_REQUEST_FAILED";
}

function getProviderErrorMessage(code) {
  const messages = {
    AI_NOT_CONFIGURED: "Gemini API key is not configured.",
    AI_INVALID_KEY: "Gemini API key is invalid.",
    AI_ACCESS_DENIED: "Gemini access was denied. Check the API key and enabled AI Studio access.",
    AI_INVALID_REQUEST: "Gemini rejected the request format.",
    AI_MODEL_UNAVAILABLE: "Gemini model is unavailable. Check the configured free-tier model.",
    AI_QUOTA_EXCEEDED: "Gemini Free Tier quota has been reached. Please try again later.",
    AI_TEMPORARY_FAILURE: "Gemini is temporarily unavailable. Please try again later.",
    AI_MALFORMED_RESPONSE: "Gemini returned an unusable response.",
  };
  return messages[code] || AI_UNAVAILABLE_MESSAGE;
}

async function callGeminiJson(systemMessage, userMessage) {
  const { apiKey, model } = getGeminiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemMessage }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(getProviderErrorMessage(getErrorCode(response.status)));
      error.code = getErrorCode(response.status);
      error.providerMessage = data.error?.message;
      throw error;
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      const error = new Error("Gemini returned no usable content.");
      error.code = "AI_MALFORMED_RESPONSE";
      throw error;
    }

    return parseJsonResponse(text);
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(AI_UNAVAILABLE_MESSAGE);
      timeoutError.code = "AI_TEMPORARY_FAILURE";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(skillData) {
  return `Actual calculated data:
Target Role: ${skillData.targetRole}
Skill: ${skillData.skillName}
Required Level: ${skillData.requiredLevel}
Current Level: ${skillData.currentLevel}
Gap: ${skillData.gap}
Importance: ${skillData.importance}
Priority: ${skillData.priority}
Status: ${skillData.status}`;
}

async function generateSkillExplanation(skillData) {
  const result = await callGeminiJson(
    "You are an educational career-readiness assistant. Explain the already calculated skill gap concisely. Do not recalculate numerical values, invent achievements, or make employment guarantees. Return JSON with exactly: whyItMatters (string), gapExplanation (string), whatToImprove (array of strings), practicalNextStep (string).",
    buildPrompt(skillData)
  );

  if (
    typeof result.whyItMatters !== "string" ||
    typeof result.gapExplanation !== "string" ||
    !Array.isArray(result.whatToImprove) ||
    !result.whatToImprove.every((item) => typeof item === "string") ||
    typeof result.practicalNextStep !== "string"
  ) {
    const error = new Error("Gemini returned an incomplete explanation.");
    error.code = "AI_MALFORMED_RESPONSE";
    throw error;
  }

  return result;
}

async function generateRoadmapStructure(skillName, targetRole, priority) {
  return callGeminiJson(
    "You design practical technical learning modules. Return JSON with learningObjectives (array of strings), recommendedTopics (array of strings), estimatedDurationHours (number), practicalExercises (array of strings), and miniProject (string).",
    `Create a structured 1-week learning module.
Skill: ${skillName}
Target Role: ${targetRole}
Gap Priority: ${priority}`
  );
}

async function generateProjectRecommendations(context) {
  const result = await callGeminiJson(
    "You recommend portfolio projects for SkillGap AI students. Use only the supplied student data and do not invent achievements or modify scores. Return JSON with a projects array containing exactly 3 to 5 objects. Every object must contain title, description, whyRecommended, skillsPracticed (array), technologies (array), difficulty (Beginner, Intermediate, or Advanced), estimatedEffortHours (positive number), expectedOutcome, relatedSkillGaps (array), and targetRoleRelationship. Do not guarantee employment.",
    `Recommend projects for this student.
Context:
${JSON.stringify(context)}`
  );

  if (!Array.isArray(result?.projects) || result.projects.length === 0) {
    const error = new Error("Gemini returned no project recommendations.");
    error.code = "AI_MALFORMED_RESPONSE";
    throw error;
  }

  const validDifficulties = new Set(["Beginner", "Intermediate", "Advanced"]);
  const valid = result.projects.every((project) =>
    project &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    typeof project.whyRecommended === "string" &&
    Array.isArray(project.skillsPracticed) &&
    project.skillsPracticed.every((skill) => typeof skill === "string") &&
    Array.isArray(project.technologies) &&
    project.technologies.every((technology) => typeof technology === "string") &&
    validDifficulties.has(project.difficulty) &&
    Number.isFinite(project.estimatedEffortHours) &&
    project.estimatedEffortHours > 0 &&
    typeof project.expectedOutcome === "string" &&
    Array.isArray(project.relatedSkillGaps) &&
    project.relatedSkillGaps.every((gap) => typeof gap === "string") &&
    typeof project.targetRoleRelationship === "string"
  );

  if (!valid) {
    const error = new Error("Gemini returned an incomplete project recommendation.");
    error.code = "AI_MALFORMED_RESPONSE";
    throw error;
  }

  return result;
}

async function enrichResumeAnalysis(context) {
  return callGeminiJson(
    "Analyze resume alignment using only the supplied extracted resume content and profile data. Never infer that an absent skill is unknown. Return JSON with representedSkills, skillsNotClearlyRepresented, missingKeywords, inconsistencies, and improvementSuggestions as arrays of strings.",
    `Resume alignment context:
${JSON.stringify(context)}`
  );
}

async function enrichJobAnalysis(context) {
  return callGeminiJson(
    "Analyze the job description against the supplied student data without guaranteeing employment. Return JSON with jobTitle, requiredSkills, preferredSkills, experienceRequirements, importantKeywords, matchingSkills, missingSkills, priorityGaps, usefulResumeKeywords, and recommendedPreparation. All fields except jobTitle must be arrays of strings.",
    `Job analysis context:
${JSON.stringify(context)}`
  );
}

module.exports = {
  AI_NOT_CONFIGURED,
  AI_UNAVAILABLE_MESSAGE,
  getProviderErrorMessage,
  generateSkillExplanation,
  generateRoadmapStructure,
  generateProjectRecommendations,
  enrichResumeAnalysis,
  enrichJobAnalysis,
};
