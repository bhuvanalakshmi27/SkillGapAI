const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://skillgap-ai-backend-8gws.onrender.com";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function uploadRequest(endpoint, formData) {
  const token = localStorage.getItem("token");
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Upload failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
  },
  profile: {
    get: (userId = "me") => request(`/api/profile/${userId}`),
    update: (userId = "me", data) =>
      request(`/api/profile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  careerRoles: {
    getAll: () => request("/api/career-roles"),
    getById: (id) => request(`/api/career-roles/${id}`),
  },
  skillAssessment: {
    getByUser: (userId = "me") => request(`/api/skill-assessment/${userId}`),
    getBySkill: (skillName, userId = "me") =>
      request(`/api/skill-assessment/${userId}/${encodeURIComponent(skillName)}`),
    save: (assessmentData) =>
      request("/api/skill-assessment", {
        method: "POST",
        body: JSON.stringify(assessmentData),
      }),
  },
  skillTests: {
    getAvailable: () => request("/api/skill-tests/available"),
    getTest: (skillName) => request(`/api/skill-tests/${encodeURIComponent(skillName)}`),
    submit: (payload) =>
      request("/api/skill-tests/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getHistory: (userId = "me") => request(`/api/skill-tests/results/${userId}`),
    getSummary: (skillName, userId = "me") =>
      request(`/api/skill-tests/results/${userId}/${encodeURIComponent(skillName)}`),
  },
  skillConfidence: {
    getAll: (userId = "me") => request(`/api/skill-confidence/${userId}`),
    getBySkill: (skillName, userId = "me") =>
      request(`/api/skill-confidence/${userId}/${encodeURIComponent(skillName)}`),
    calculate: (skillName) =>
      request("/api/skill-confidence/calculate", {
        method: "POST",
        body: JSON.stringify({ skillName }),
      }),
  },
  skillGap: {
    get: (userId = "me") => request(`/api/skill-gap/${userId}`),
    analyze: () =>
      request("/api/skill-gap/analyze", {
        method: "POST",
      }),
  },
  ai: {
    getExplanation: (skillName) =>
      request("/api/ai/skill-explanation", {
        method: "POST",
        body: JSON.stringify({ skillName }),
      }),
  },
  roadmap: {
    get: () => request("/api/roadmap/me"),
    generate: () => request("/api/roadmap/generate", { method: "POST" }),
    continue: () => request("/api/roadmap/continue", { method: "POST" }),
    toggleItem: (itemId, isCompleted) =>
      request("/api/roadmap/toggle-item", {
        method: "PUT",
        body: JSON.stringify({ itemId, isCompleted }),
      }),
  },
  projectRecommendations: {
    getAll: () => request("/api/project-recommendations/me"),
    getById: (id) => request(`/api/project-recommendations/${id}`),
    generate: () => request("/api/project-recommendations/generate", { method: "POST" }),
    updateStatus: (id, status) =>
      request(`/api/project-recommendations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  projectEvidence: {
    getAll: () => request("/api/project-evidence/me"),
    create: (payload) =>
      request("/api/project-evidence", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id, payload) =>
      request(`/api/project-evidence/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    complete: (id) => request(`/api/project-evidence/${id}/complete`, { method: "PATCH" }),
    remove: (id) => request(`/api/project-evidence/${id}`, { method: "DELETE" }),
  },
  resumeAnalysis: {
    history: () => request("/api/resume-analysis/history"),
    getById: (id) => request(`/api/resume-analysis/${id}`),
    analyze: (file) => {
      const formData = new FormData();
      formData.append("resume", file);
      return uploadRequest("/api/resume-analysis/analyze", formData);
    },
  },
  jobAnalyzer: {
    history: () => request("/api/job-analyzer/history"),
    getById: (id) => request(`/api/job-analyzer/${id}`),
    analyze: (payload) =>
      request("/api/job-analyzer/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  careerReadiness: {
    get: () => request("/api/career-readiness/me"),
  },
  progress: {
    get: () => request("/api/progress/me"),
  },
  admin: {
    analytics: () => request("/api/admin/analytics"),
  },
  settings: {
    get: () => request("/api/settings/me"),
  },
};

export default api;
