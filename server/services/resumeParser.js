const fs = require("fs");
const path = require("path");

async function extractTextFromFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") {
    const { PDFParse } = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  throw new Error("Unsupported file type. Upload PDF or DOCX.");
}

function extractKeywordList(text) {
  const tokens = text
    .split(/[^a-zA-Z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const frequency = new Map();
  tokens.forEach((token) => {
    const key = token.toLowerCase();
    frequency.set(key, (frequency.get(key) || 0) + 1);
  });

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 40)
    .map(([word]) => word);
}

function extractSectionLines(text, headingPattern) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const section = [];
  let capture = false;

  lines.forEach((line) => {
    if (headingPattern.test(line)) {
      capture = true;
      return;
    }
    if (capture && /^(skills|education|experience|projects|certifications|summary)/i.test(line)) {
      capture = false;
    }
    if (capture) section.push(line);
  });

  return section.slice(0, 12);
}

function parseResumeHeuristics(text) {
  const knownSkills = [
    "HTML", "CSS", "HTML/CSS", "JavaScript", "TypeScript", "React", "Node.js",
    "Express.js", "Python", "Java", "SQL", "MongoDB", "Databases", "Git",
    "GitHub", "REST APIs", "Docker", "AWS", "Kubernetes", "Agile",
  ];
  const lowerText = text.toLowerCase();
  const detectedSkills = knownSkills.filter((skill) => lowerText.includes(skill.toLowerCase()));
  const skillsSection = extractSectionLines(text, /^(technical skills|skills|core competencies)/i);
  const skills = [...new Set([...detectedSkills, ...skillsSection])];
  const education = extractSectionLines(text, /^(education|academic background)/i);
  const experience = extractSectionLines(text, /^(experience|work experience|employment)/i);
  const projects = extractSectionLines(text, /^(projects|personal projects)/i);
  const certifications = extractSectionLines(text, /^(certifications|licenses)/i);

  return {
    skills,
    education,
    experience,
    projects,
    certifications,
    keywords: extractKeywordList(text),
  };
}

module.exports = {
  extractTextFromFile,
  parseResumeHeuristics,
};
