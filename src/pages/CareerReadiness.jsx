import { useEffect, useState } from "react";
import { Activity, Award, BookOpen, BriefcaseBusiness, FileText, Gauge, Info, Target, TestTube2 } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Card, EmptyState, LoadingState, PageHeader, ProgressBar, SectionHeader } from "../components/ui";
import { api } from "../services/api";

const sectionLabels = {
  skillReadiness: "Skill readiness",
  assessmentCoverage: "Assessment coverage",
  projectEvidence: "Project evidence",
  resumeReadiness: "Resume readiness",
  learningProgress: "Learning progress",
};

const sectionIcons = {
  skillReadiness: Target,
  assessmentCoverage: TestTube2,
  projectEvidence: BriefcaseBusiness,
  resumeReadiness: FileText,
  learningProgress: BookOpen,
};

function CareerReadiness() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.careerReadiness.get()
      .then(setData)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><LoadingState label="Calculating career readiness" /></AppShell>;
  if (!data) return <AppShell><EmptyState icon={Gauge} title="Readiness unavailable" description={message || "Complete assessments and gap analysis first."} /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Preparation dashboard"
        title="Career Readiness"
        description="Track how prepared your current profile is for your target role."
        action={<Badge tone="violet"><Target size={13} /> {data.targetRole || "Target role not set"}</Badge>}
      />

      <div className="readiness-role-row">
        <div><span className="readiness-label">Target role</span><strong>{data.targetRole || "Not set"}</strong></div>
        <p><Info size={14} /> {data.disclaimer}</p>
      </div>

      <Card className={`readiness-hero redesigned-readiness-hero ${typeof data.overallReadiness === "number" ? "has-score" : "is-pending"}`}>
        <div className="readiness-hero-icon"><Gauge size={26} /></div>
        <div className="readiness-hero-copy">
          <span className="eyebrow">Overall preparation indicator</span>
          <h2>{typeof data.overallReadiness === "number" ? `${data.overallReadiness}% ready` : "Not available yet"}</h2>
          <p>{typeof data.overallReadiness === "number" ? data.readinessStatus : "Complete more skill assessments and mini tests to generate a meaningful readiness indicator."}</p>
          {typeof data.overallReadiness === "number" && <ProgressBar value={data.overallReadiness} tone="blue" />}
        </div>
        <Badge tone={typeof data.overallReadiness === "number" ? "green" : "blue"} dot>{typeof data.overallReadiness === "number" ? "Calculated" : "Building profile"}</Badge>
      </Card>

      <section className="readiness-section">
        <SectionHeader title="Score Breakdown" description="A focused view of the signals contributing to your preparation profile." />
        <div className="readiness-breakdown-grid">
          {Object.entries(data.sections || {}).map(([key, section]) => {
            const Icon = sectionIcons[key] || Activity;
            const available = typeof section.score === "number";
            return (
              <Card className={`readiness-breakdown-card ${available ? "is-available" : "is-unavailable"}`} key={key}>
                <div className="readiness-card-top"><span className="readiness-card-icon"><Icon size={17} /></span><Badge tone={available ? "green" : "blue"}>{available ? "Available" : "Not available"}</Badge></div>
                <span className="readiness-label">{sectionLabels[key] || key}</span>
                <strong>{available ? section.score : "Not available"}</strong>
                <p>{section.detail}</p>
                {available && <ProgressBar value={section.score} tone="blue" />}
              </Card>
            );
          })}
        </div>
        <p className="readiness-source-note">Based on your recorded profile activity and assessments.</p>
      </section>

      <section className="readiness-section">
        <SectionHeader title={`${data.targetRole || "Target Role"} Readiness`} description="The role-specific coverage recorded in your current profile." />
        <div className="readiness-role-stats">
          <div><span>Skill readiness</span><strong>{data.sections?.skillReadiness?.detail || "Not available"}</strong></div>
          <div><span>Assessment coverage</span><strong>{data.sections?.assessmentCoverage?.detail || "Not available"}</strong></div>
          <div><span>Project evidence</span><strong>{data.sections?.projectEvidence?.detail || "Not available"}</strong></div>
          <div><span>Resume readiness</span><strong>{data.sections?.resumeReadiness?.detail || "Not available"}</strong></div>
        </div>
      </section>

      <div className="readiness-two-column">
        <Card className="readiness-content-card">
          <div className="readiness-card-heading"><Award size={18} /><h3>Current Strengths</h3></div>
          {data.strengths?.length ? data.strengths.map((item) => (
            <div className="readiness-strength-item" key={item.area}><Badge tone="green">{sectionLabels[item.area] || item.area}</Badge><p>{item.detail}</p></div>
          )) : <div className="readiness-empty"><strong>No confirmed strengths yet</strong><p>Build more assessment and project evidence to identify your strongest areas.</p></div>}
        </Card>
        <Card className="readiness-content-card">
          <div className="readiness-card-heading"><AlertIcon /><h3>Priority Improvement Areas</h3></div>
          {data.priorityGaps?.length ? (
            <div className="readiness-gap-list">
              {data.priorityGaps.map((item) => <div className="readiness-gap-item" key={item.skill}><div><strong>{item.skill}</strong><p>Current {item.currentLevel ?? "Not assessed"} · Required {item.requiredLevel} · Gap {item.gap}</p></div><Badge tone="amber">{item.priority}</Badge></div>)}
            </div>
          ) : <div className="readiness-empty"><strong>No priority gaps recorded yet</strong><p>Run a skill gap analysis after completing more assessments.</p></div>}
        </Card>
      </div>

      <section className="readiness-section">
        <SectionHeader title="Recommended Next Steps" description="Actions already identified from your recorded readiness data." />
        <div className="readiness-actions-grid">
          {data.recommendedNextActions?.length ? data.recommendedNextActions.map((item, index) => <div className="readiness-action-item" key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>) : <p className="field-hint">No next actions available yet.</p>}
        </div>
      </section>

      <details className="card readiness-details">
        <summary>How is readiness calculated?</summary>
        <p>{data.formulaExplanation}</p>
        <p className="field-hint">Sections with no data are excluded from the average.</p>
      </details>
    </AppShell>
  );
}

function AlertIcon() {
  return <span className="readiness-alert-icon"><Activity size={17} /></span>;
}

export default CareerReadiness;
