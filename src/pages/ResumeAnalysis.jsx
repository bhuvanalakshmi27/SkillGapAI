import { useEffect, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader, SectionHeader } from "../components/ui";
import { api } from "../services/api";

const acceptedResumeTypes = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function ResumeList({ items, emptyLabel = "Not detected in this resume" }) {
  if (!items?.length) return <p className="resume-muted">{emptyLabel}</p>;
  return (
    <ul className="resume-detail-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function ResumeChipGroup({ items, tone = "blue", emptyLabel = "Not detected" }) {
  if (!items?.length) return <p className="resume-muted">{emptyLabel}</p>;
  return <div className="resume-chip-group">{items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>)}</div>;
}

function ResumeAnalysisPage() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.resumeAnalysis.history()
      .then((data) => {
        if (data[0]) return api.resumeAnalysis.getById(data[0]._id).then(setLatest);
        return null;
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const analyze = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a PDF or DOCX resume file.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const record = await api.resumeAnalysis.analyze(file);
      setLatest(record);
      setFile(null);
    } catch (error) {
      setMessage(error.message || "Resume analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const selectFile = (event) => {
    setMessage("");
    setFile(event.target.files?.[0] || null);
  };

  if (loading) return <AppShell><LoadingState label="Loading resume analysis" /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Resume alignment"
        title="Resume Analysis"
        description="Upload your resume to understand how well it represents your skills, experience, projects, and target career."
        action={<Badge tone="blue"><FileText size={13} /> Resume analysis</Badge>}
      />

      <Card className="resume-upload-card">
        <SectionHeader title="Upload your resume" description="Use your latest resume for a real, text-based analysis." />
        <form onSubmit={analyze}>
          <label className={`resume-dropzone ${file ? "has-file" : ""}`}>
            <input type="file" accept={acceptedResumeTypes} onChange={selectFile} />
            <span className="resume-upload-icon"><Upload size={22} /></span>
            {file ? (
              <>
                <strong>{file.name}</strong>
                <span className="resume-muted">{file.type || "Resume file"}{file.size ? ` • ${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</span>
              </>
            ) : (
              <>
                <strong>Choose a resume to analyze</strong>
                <span className="resume-muted">PDF or DOCX files up to the supported upload limit</span>
              </>
            )}
            <span className="button button-secondary button-md">{file ? "Change resume" : "Browse files"}</span>
          </label>
          {message && <div className="resume-alert" role="alert"><p>{message}</p></div>}
          <div className="resume-upload-actions">
            {file && <span className="resume-selected-label"><CheckCircle2 size={15} /> Resume selected</span>}
            <Button type="submit" icon={busy ? RefreshCw : Sparkles} disabled={busy}>
              {busy ? "Analyzing your resume..." : "Analyze resume"}
            </Button>
          </div>
        </form>
      </Card>

      {busy && (
        <Card className="resume-analyzing-card">
          <RefreshCw className="spin" size={21} />
          <div><strong>Analyzing your resume...</strong><p>Extracting skills, projects, education, and experience from the uploaded file.</p></div>
        </Card>
      )}

      {!latest ? (
        <EmptyState icon={FileText} title="No resume analyzed yet" description="Upload your resume to see skill representation and career alignment insights." />
      ) : (
        <div className="resume-report">
          <Card className="resume-result-header">
            <div><span className="eyebrow">Latest analysis</span><h2>Resume Analysis Results</h2><p>{latest.originalFileName || "Resume file"}{latest.createdAt ? ` • ${new Date(latest.createdAt).toLocaleDateString()}` : ""}</p></div>
            <div className="resume-target"><span>Target role</span><strong>{latest.targetRoleAtAnalysis || "Not available"}</strong></div>
          </Card>

          <section className="resume-report-section">
            <SectionHeader title="Resume overview" description="Counts and detection status from the actual extracted resume data." />
            <div className="resume-summary-grid">
              <div><span>Skills detected</span><strong>{latest.skills?.length ?? 0}</strong></div>
              <div><span>Keywords found</span><strong>{latest.keywords?.length ?? 0}</strong></div>
              <div><span>Projects</span><strong>{latest.projects?.length ?? 0}</strong><small>{latest.projects?.length ? "Detected" : "Not detected"}</small></div>
              <div><span>Education</span><strong>{latest.education?.length ?? 0}</strong><small>{latest.education?.length ? "Detected" : "Not detected"}</small></div>
              <div><span>Experience</span><strong>{latest.experience?.length ?? 0}</strong><small>{latest.experience?.length ? "Detected" : "Not detected"}</small></div>
              <div><span>Certifications</span><strong>{latest.certifications?.length ?? 0}</strong><small>{latest.certifications?.length ? "Detected" : "Not detected"}</small></div>
            </div>
          </section>

          <section className="resume-report-section">
            <SectionHeader title="Target role alignment" description="Resume representation is evidence-based; an absent skill does not mean you lack it." />
            <Card className="resume-alignment-card">
              <div className="resume-alignment-role"><span className="resume-upload-icon"><Target size={18} /></span><div><span>Target role</span><strong>{latest.targetRoleAtAnalysis || "Not available"}</strong></div></div>
              <div className="resume-alignment-columns">
                <div><h3><CheckCircle2 size={15} /> Clearly represented</h3><ResumeChipGroup items={latest.representedSkills} tone="green" /></div>
                <div><h3><Lightbulb size={15} /> Not clearly represented</h3><ResumeChipGroup items={latest.skillsNotClearlyRepresented} tone="amber" /><p className="resume-muted">This describes resume evidence only, not your actual ability.</p></div>
              </div>
            </Card>
          </section>

          <div className="resume-report-grid">
            <Card className="resume-report-card"><SectionHeader title="Detected skills" /><ResumeChipGroup items={latest.skills} /></Card>
            <Card className="resume-report-card"><SectionHeader title="Resume keywords" /><ResumeChipGroup items={latest.keywords} emptyLabel="No keywords detected" /></Card>
          </div>

          <section className="resume-report-section">
            <SectionHeader title="Extracted resume information" description="Only information detected in the uploaded resume is shown." />
            <div className="resume-report-grid">
              <ResumeDataCard icon={GraduationCap} title="Education" items={latest.education} />
              <ResumeDataCard icon={BriefcaseBusiness} title="Experience" items={latest.experience} />
              <ResumeDataCard icon={FolderKanban} title="Projects" items={latest.projects} />
              <ResumeDataCard icon={Award} title="Certifications" items={latest.certifications} />
            </div>
          </section>

          <section className="resume-report-grid">
            <Card className="resume-report-card"><SectionHeader title="Missing keywords" /><ResumeList items={latest.missingKeywords} /></Card>
            <Card className="resume-report-card"><SectionHeader title="Resume improvement areas" /><ResumeList items={latest.improvementSuggestions} /></Card>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function ResumeDataCard({ icon: Icon, title, items }) {
  return <Card className="resume-report-card"><div className="resume-data-heading"><span className="resume-data-icon"><Icon size={17} /></span><h3>{title}</h3></div><ResumeList items={items} /></Card>;
}

export default ResumeAnalysisPage;
