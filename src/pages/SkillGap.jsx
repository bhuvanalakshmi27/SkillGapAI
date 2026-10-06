import { Fragment, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ClipboardList, Sparkles, Target, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader } from "../components/ui";
import { api } from "../services/api";

function statusTone(status) {
  if (status === "Meets Requirement") return "green";
  if (status === "Gap") return "red";
  return "blue";
}

function priorityTone(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "amber";
  if (priority === "None") return "green";
  return "blue";
}

function SkillGap() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [explanationLoading, setExplanationLoading] = useState("");
  const [explanationErrors, setExplanationErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.profile.get("me"),
      api.skillGap.get("me").catch((error) => {
        if (error.status === 404) return null;
        throw error;
      }),
    ])
      .then(([profileData, analysisData]) => {
        setProfile(profileData);
        setAnalysis(analysisData);
      })
      .catch((error) => setMessage(error.message || "Unable to load your skill gap workspace."))
      .finally(() => setLoading(false));
  }, []);

  const runAnalysis = async () => {
    setAnalysisLoading(true);
    setMessage("");
    try {
      const data = await api.skillGap.analyze();
      setAnalysis(data);
    } catch (error) {
      setMessage(error.message || "Unable to run skill gap analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const summary = useMemo(() => {
    const skills = analysis?.skills || [];
    return {
      required: skills.length,
      meeting: skills.filter((skill) => skill.status === "Meets Requirement").length,
      gaps: skills.filter((skill) => skill.status === "Gap").length,
      notAssessed: skills.filter((skill) => skill.status === "Not Assessed").length,
    };
  }, [analysis]);

  const chartData = (analysis?.skills || [])
    .filter((skill) => skill.currentLevel !== null)
    .map((skill) => ({
      skill: skill.skillName,
      required: skill.requiredLevel,
      current: skill.currentLevel,
    }));

  const groupedSkills = useMemo(() => {
    const groups = ["High", "Medium", "Low", "Assessment Required"];
    return groups.map((priority) => ({
      priority,
      skills: (analysis?.skills || [])
        .filter((skill) => skill.priority === priority)
        .sort((left, right) => (right.gap ?? -1) - (left.gap ?? -1)),
    })).filter((group) => group.skills.length > 0);
  }, [analysis]);

  const explainSkill = async (skillName) => {
    setExplanationLoading(skillName);
    setExplanationErrors((current) => ({ ...current, [skillName]: "" }));

    try {
      const data = await api.ai.getExplanation(skillName);
      setExplanations((current) => ({ ...current, [skillName]: data }));
    } catch (error) {
      setExplanationErrors((current) => ({ ...current, [skillName]: error.message || "Unable to generate explanation" }));
    } finally {
      setExplanationLoading("");
    }
  };

  if (loading) {
    return <AppShell><LoadingState label="Loading your skill gap analysis" /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Career requirements"
        title="Skill Gap Analysis"
        description="Compare your assessed confidence with the requirements of your target role."
        action={<Link className="button button-ghost button-md" to="/profile">Update profile</Link>}
      />

      {message && !analysis ? (
        <Card className="skill-gap-empty-card">
          <EmptyState
            title={message}
            description="Resolve the issue below, then run analysis using your saved profile and real assessment data."
            action={<Link className="button button-primary button-md" to="/profile">Open profile</Link>}
          />
        </Card>
      ) : !analysis ? (
        <Card className="skill-gap-empty-card">
          <EmptyState
            title={profile?.targetRole ? "Your profile is ready. Run Skill Gap Analysis." : "Select a target role to begin."}
            description={profile?.targetRole
              ? "Your saved target role will be compared with available confidence records. Unassessed skills will remain clearly marked."
              : "Choose a supported career role in Profile before running analysis."}
            action={profile?.targetRole
              ? <Button onClick={runAnalysis} disabled={analysisLoading}>{analysisLoading ? "Running analysis..." : "Run Skill Gap Analysis"}</Button>
              : <Link className="button button-primary button-md" to="/profile">Open profile</Link>}
          />
        </Card>
      ) : analysis && (
        <>
          <Card className="skill-gap-role-banner"><span className="dashboard-icon"><Target size={20} /></span><div><p className="card-kicker">Target role</p><h2>{analysis.targetRole}</h2></div><Badge tone="violet">Deterministic gap analysis</Badge></Card>
          <div className="skill-gap-summary-grid">
            <Card><span className="summary-icon"><ClipboardList size={17} /></span><span>Required Skills</span><strong>{summary.required}</strong></Card>
            <Card><span className="summary-icon summary-green"><CheckCircle2 size={17} /></span><span>Meeting Requirement</span><strong>{summary.meeting}</strong></Card>
            <Card><span className="summary-icon summary-red"><XCircle size={17} /></span><span>Skill Gaps</span><strong>{summary.gaps}</strong></Card>
            <Card><span className="summary-icon summary-blue"><Target size={17} /></span><span>Not Assessed</span><strong>{summary.notAssessed}</strong></Card>
          </div>
          <Card className="skill-gap-table-card">
            <div className="skill-gap-section-heading"><div><p className="card-kicker">Role requirements</p><h2>Where to focus next</h2></div><Badge tone="blue">Updated {new Date(analysis.analyzedAt).toLocaleDateString()}</Badge></div>
            <div className="skill-gap-table-wrap">
              <table className="skill-gap-table"><thead><tr><th>Skill</th><th>Required</th><th>Current</th><th>Gap</th><th>Status</th><th>Importance</th><th>Priority</th><th>Guidance</th></tr></thead><tbody>{groupedSkills.map((group) => <Fragment key={group.priority}><tr className="priority-group-row"><td colSpan="8"><span>{group.priority} Priority Gaps</span><small>{group.skills.length} skill{group.skills.length === 1 ? "" : "s"}</small></td></tr>{group.skills.map((skill) => <tr key={skill.skillName}><td><strong>{skill.skillName}</strong></td><td>{skill.requiredLevel}</td><td>{skill.currentLevel === null ? "Not Assessed" : skill.currentLevel}</td><td>{skill.gap === null ? "—" : skill.gap}</td><td><Badge tone={statusTone(skill.status)}>{skill.status}</Badge></td><td>{skill.importance}</td><td><Badge tone={priorityTone(skill.priority)}>{skill.priority}</Badge></td><td className="skill-guidance-cell">{skill.status === "Gap" && skill.currentLevel !== null ? <><button className="ai-explain-button" type="button" onClick={() => explainSkill(skill.skillName)} disabled={explanationLoading === skill.skillName}><Sparkles size={14} />{explanationLoading === skill.skillName ? "Generating..." : "AI Explanation"}</button>{explanationErrors[skill.skillName] && <small className="explanation-error">{explanationErrors[skill.skillName]}</small>}{explanations[skill.skillName] && <div className="ai-explanation"><strong>Why this skill matters</strong><p>{explanations[skill.skillName].whyItMatters}</p><strong>What your gap means</strong><p>{explanations[skill.skillName].gapExplanation}</p><strong>What to improve</strong><ul>{explanations[skill.skillName].whatToImprove.map((item) => <li key={item}>{item}</li>)}</ul><strong>Practical next step</strong><p>{explanations[skill.skillName].practicalNextStep}</p><button className="text-button" type="button" onClick={() => explainSkill(skill.skillName)}>Regenerate Explanation</button></div>}</> : skill.status === "Not Assessed" ? <span className="assess-skill-note">Complete self-assessment & mini test.<Link to="/skill-assessment">Assess Skill</Link></span> : <span className="no-guidance-note">Requirement met.</span>}</td></tr>)}</Fragment>)}</tbody></table>
            </div>
          </Card>
          <Card className="skill-gap-chart-card">
            <div className="skill-gap-section-heading"><div><p className="card-kicker">Assessed skills only</p><h2>Required Level vs Current Level</h2></div><BarChart3 size={20} className="chart-heading-icon" /></div>
            {chartData.length > 0 ? <div className="skill-gap-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}><CartesianGrid stroke="rgba(143, 158, 204, .09)" vertical={false} /><XAxis dataKey="skill" axisLine={false} tickLine={false} tick={{ fill: "#717b96", fontSize: 10 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#59647f", fontSize: 9 }} /><Tooltip contentStyle={{ background: "#111a35", border: "1px solid rgba(143, 158, 204, .2)", borderRadius: 8, color: "#f5f7ff", fontSize: 11 }} /><Legend wrapperStyle={{ color: "#a8b1c7", fontSize: 10 }} /><Bar dataKey="required" name="Required" fill="#6f8cff" radius={[4, 4, 0, 0]} /><Bar dataKey="current" name="Current" fill="#51d6a1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No assessed skills to chart" description="Complete a self-assessment and mini skill test to compare real levels here." />}
          </Card>
        </>
      )}
    </AppShell>
  );
}

export default SkillGap;
