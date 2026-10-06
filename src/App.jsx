import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SkillAssessment from "./pages/SkillAssessment";
import SkillTest from "./pages/SkillTest";
import SkillGap from "./pages/SkillGap";
import Roadmap from "./pages/Roadmap";
import ProjectRecommendations from "./pages/ProjectRecommendations";
import ProjectEvidence from "./pages/ProjectEvidence";
import ResumeAnalysisPage from "./pages/ResumeAnalysis";
import JobAnalyzer from "./pages/JobAnalyzer";
import CareerReadiness from "./pages/CareerReadiness";
import WeeklyProgress from "./pages/WeeklyProgress";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

function RootRedirect() {
  const isAuthenticated = Boolean(
    localStorage.getItem("token") && localStorage.getItem("userId")
  );

  return <Navigate to={isAuthenticated ? "/overview" : "/login"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/overview" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skill-assessment" element={<SkillAssessment />} />
          <Route path="/skill-test" element={<SkillTest />} />
          <Route path="/skill-gap" element={<SkillGap />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/project-recommendations" element={<ProjectRecommendations />} />
          <Route path="/project-evidence" element={<ProjectEvidence />} />
          <Route path="/resume-analysis" element={<ResumeAnalysisPage />} />
          <Route path="/job-analyzer" element={<JobAnalyzer />} />
          <Route path="/career-readiness" element={<CareerReadiness />} />
          <Route path="/weekly-progress" element={<WeeklyProgress />} />
          <Route path="/settings" element={<Settings />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
