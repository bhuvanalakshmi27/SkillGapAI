const editableFields = [
  "projectName",
  "description",
  "technologies",
  "skillsDemonstrated",
  "githubUrl",
  "liveDemoUrl",
  "completionDate",
  "difficulty",
  "status",
  "screenshotUrls",
];

function buildProjectUpdate(body) {
  const update = {};

  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      update[field] = body[field];
    }
  });

  if (typeof update.projectName === "string") {
    update.projectName = update.projectName.trim();
    if (!update.projectName) throw new Error("Project name is required");
  }

  ["technologies", "skillsDemonstrated", "screenshotUrls"].forEach((field) => {
    if (field in update && !Array.isArray(update[field])) {
      throw new Error(`${field} must be an array`);
    }
  });

  ["githubUrl", "liveDemoUrl"].forEach((field) => {
    if (field in update && update[field]) {
      let parsedUrl;
      try {
        parsedUrl = new URL(update[field]);
      } catch {
        throw new Error(`${field} must be a valid URL`);
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error(`${field} must use HTTP or HTTPS`);
      }
    }
  });

  return update;
}

module.exports = { buildProjectUpdate };
