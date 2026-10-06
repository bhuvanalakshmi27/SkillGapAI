import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Award,
  BrainCircuit,
  ChevronRight,
  Code2,
  FilePlus2,
  FlaskConical,
  GraduationCap,
  Map,
  PenLine,
  Target,
  LockKeyhole,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  SectionHeader,
} from "../components/ui";
import { api } from "../services/api";

const actionItems = [
  { label: "Analyze skill gap", detail: "See what to learn next", icon: BrainCircuit },
  { label: "Take skill test", detail: "Benchmark your strengths", icon: FlaskConical },
  { label: "View learning roadmap", detail: "Turn gaps into a plan", icon: Map },
  { label: "Add project evidence", detail: "Show what you can do", icon: FilePlus2 },
];

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [confidenceRecords, setConfidenceRecords] = useState([]);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.profile.get("me").catch(() => null),
      api.skillGap.get("me").catch(() => null),
      api.skillConfidence.getAll("me").catch(() => []),
    ]).then(([profileData, gapData, confData]) => {
      if (profileData) setProfile(profileData);
      if (gapData) setSkillGapAnalysis(gapData);
      if (confData) setConfidenceRecords(confData);
      setLoading(false);
    });
  }, []);

  const skills = Array.isArray(profile?.skills)
    ? profile.skills.filter(Boolean).slice(0, 6)
    : [];

  const profileName = profile?.name?.split(" ")[0] || "Student";
  const targetRole = profile?.targetRole || "Target role not set";
  const profileReady = Boolean(profile?.targetRole || skills.length || profile?.college);

  const handleAction = async (label) => {
    if (label === "Take skill test") {
      navigate("/skill-test");
      return;
    }

    if (label === "View learning roadmap") {
      navigate("/roadmap");
      return;
    }

    if (label === "Add project evidence") {
      navigate("/project-evidence");
      return;
    }

    if (label === "Analyze skill gap") {
      setAnalysisLoading(true);
      setNotice("");

      try {
        const data = await api.skillGap.analyze();
        setSkillGapAnalysis(data);
        navigate("/skill-gap");
      } catch (error) {
        setNotice(error.message || "Unable to analyze your skill gap");
      } finally {
        setAnalysisLoading(false);
      }

      return;
    }

    setNotice(`Action not mapped: ${label}`);
  };

  const analyzedSkills = skillGapAnalysis?.skills || [];
  const analyzedSummary = {
    total: analyzedSkills.length,
    meeting: analyzedSkills.filter((skill) => skill.status === "Meets Requirement").length,
    high: analyzedSkills.filter((skill) => skill.priority === "High").length,
    medium: analyzedSkills.filter((skill) => skill.priority === "Medium").length,
    low: analyzedSkills.filter((skill) => skill.priority === "Low").length,
    notAssessed: analyzedSkills.filter((skill) => skill.status === "Not Assessed").length,
  };

  // Deterministic Readiness Score metric (0-100) based on assessed skill gap coverage
  const readinessPercent = analyzedSummary.total > 0
    ? Math.round((analyzedSummary.meeting / analyzedSummary.total) * 100)
    : null;

  if (loading) {
    return <AppShell><LoadingState label="Loading your career workspace" /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Career readiness workspace"
        title={`Welcome back, ${profileName}.`}
        description="A focused view of your progress, strengths and next best moves."
        action={<Link to="/profile"><Button icon={PenLine}>Edit profile</Button></Link>}
      />

      {!profileReady && (
        <Card className="overview-empty-banner">
          <div className="overview-empty-icon"><GraduationCap size={21} /></div>
          <div><strong>Your dashboard is ready for your story.</strong><p>Add your target role and current skills to unlock a more relevant readiness view.</p></div>
          <Link className="text-button" to="/profile">Complete profile <ArrowUpRight size={14} /></Link>
        </Card>
      )}

      <section className="overview-top-grid">
        <Card className="career-card">
          <div className="dashboard-card-heading">
            <span className="dashboard-icon"><Target size={19} /></span>
            <div><p className="card-kicker">Target career</p><h2>Where you want to go</h2></div>
            <Badge tone={profile?.targetRole ? "green" : "blue"} dot>{profile?.targetRole ? "Configured" : "Needs setup"}</Badge>
          </div>
          <div className="career-role">
            <span className="career-role-icon"><Code2 size={22} /></span>
            <div>
              <span className="card-label">Target role</span>
              <h3>{targetRole}</h3>
              <p>{profile?.targetRole ? "Your readiness plan is anchored to this role." : "Select a target role in Profile to personalize your analysis."}</p>
            </div>
          </div>
          <Link className="text-button" to="/profile">{profile?.targetRole ? "Update target role" : "Set target role"} <ArrowUpRight size={14} /></Link>
        </Card>

        <Card className="readiness-card">
          <div className="dashboard-card-heading">
            <span className="dashboard-icon readiness-icon"><Award size={19} /></span>
            <div><p className="card-kicker">Career readiness</p><h2>Requirement Signal</h2></div>
            <Badge tone={readinessPercent !== null ? "green" : "violet"}>
              {readinessPercent !== null ? `${readinessPercent}% Matched` : "Assessment pending"}
            </Badge>
          </div>
          <div className="readiness-body">
            <div className="readiness-pending-orb">
              <span>{readinessPercent !== null ? `${readinessPercent}%` : "—"}</span>
              <small>{readinessPercent !== null ? "Coverage" : "Not assessed"}</small>
            </div>
            <div className="readiness-copy">
              <strong>{readinessPercent !== null ? `${analyzedSummary.meeting} of ${analyzedSummary.total} Skills Met` : "Not assessed yet"}</strong>
              <p>
                {readinessPercent !== null
                  ? `You currently meet the requirement for ${analyzedSummary.meeting} out of ${analyzedSummary.total} skills for ${skillGapAnalysis.targetRole}.`
                  : "Complete your self-assessment and mini skill tests to unlock your readiness score."}
              </p>
              <span><LockKeyhole size={14} /> Full readiness score model active</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="overview-section confidence-overview-section">
        <SectionHeader title="My Skill Confidence" description="Calculated confidence records from self-assessment (40%) + mini test (60%)." action={<Link className="text-button" to="/skill-assessment">Take Skill Assessment <ArrowUpRight size={14} /></Link>} />
        {confidenceRecords.length > 0 ? (
          <div className="confidence-overview-grid">{confidenceRecords.map((record) => <Card className="confidence-overview-card" key={record._id}><div><p className="card-kicker">{record.skillName}</p><strong>{record.confidenceScore}<span>/100</span></strong><p>{record.level}</p></div><Badge tone="green">Calculated</Badge></Card>)}</div>
        ) : (
          <Card className="confidence-overview-empty"><EmptyState title="No skill confidence calculated yet." description="Complete a self-assessment and mini skill test to calculate a real confidence score." action={<Link className="button button-ghost button-md" to="/skill-assessment">Take Skill Assessment</Link>} /></Card>
        )}
      </section>

      <section className="overview-section">
        <SectionHeader title="Skill overview" description={skills.length ? "Your current skills from your profile." : "Add skills to see your current strengths here."} action={<Link className="text-button" to="/profile">Manage skills <ChevronRight size={14} /></Link>} />
        {skills.length ? (
          <div className="skill-grid">{skills.map((skill) => <Card className="skill-card" key={skill}><div className="skill-card-top"><span className="skill-symbol"><Code2 size={16} /></span><strong>{skill}</strong><Badge tone="blue">Profile Skill</Badge></div><p className="skill-pending-copy">Assessed via Skill Tests</p></Card>)}</div>
        ) : <EmptyState title="No skills mapped yet" description="Your current skills will appear here after you complete your profile." action={<Link className="text-button" to="/profile">Add skills <ArrowUpRight size={14} /></Link>} />}
      </section>

      <section className="overview-section">
        <SectionHeader title="Skill Gap Analysis" description={skillGapAnalysis ? `Real gap analysis for ${skillGapAnalysis.targetRole}.` : "Compare your current skills with the requirements of your target career role."} action={skillGapAnalysis ? <Link className="text-button" to="/skill-gap">View Skill Gap Analysis <ArrowUpRight size={14} /></Link> : <button className="button button-primary button-md" type="button" disabled={analysisLoading} onClick={() => handleAction("Analyze skill gap")}>{analysisLoading ? "Analyzing your skill gap..." : "Analyze Skill Gap"}</button>} />
        {skillGapAnalysis ? (
          <div className="overview-gap-summary"><Card><span className="card-kicker">High Priority Gaps</span><strong>{analyzedSummary.high}</strong></Card><Card><span className="card-kicker">Medium Priority Gaps</span><strong>{analyzedSummary.medium}</strong></Card><Card><span className="card-kicker">Low Priority Gaps</span><strong>{analyzedSummary.low}</strong></Card><Card><span className="card-kicker">Assessment Required</span><strong>{analyzedSummary.notAssessed}</strong></Card></div>
        ) : (
          <Card className="overview-empty-banner"><div className="overview-empty-icon"><BrainCircuit size={21} /></div><div><strong>Skill gap analysis not completed yet.</strong><p>Run an analysis after choosing a target role and calculating real skill confidence.</p></div><Link className="text-button" to="/profile">Review profile <ArrowUpRight size={14} /></Link></Card>
        )}
      </section>

      <section className="overview-section">
        <SectionHeader title="Quick actions" description="Keep your next step close." />
        <div className="quick-action-grid">{actionItems.map(({ label, detail, icon: Icon }) => <button className="quick-action" key={label} type="button" disabled={label === "Analyze skill gap" && analysisLoading} onClick={() => handleAction(label)}><span className="quick-action-icon"><Icon size={19} /></span><span><strong>{label}</strong><small>{label === "Analyze skill gap" && analysisLoading ? "Analyzing your skill gap..." : detail}</small></span><span className="quick-action-status">{label === "Analyze skill gap" && analysisLoading ? "Working..." : label === "Analyze skill gap" ? "Run analysis" : "Active"}</span></button>)}</div>
        {notice && <p className="overview-notice" role="status">{notice}</p>}
      </section>
    </AppShell>
  );
}

export default Home;
