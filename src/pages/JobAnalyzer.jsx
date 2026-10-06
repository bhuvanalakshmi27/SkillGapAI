import { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  History,
  Search,
  Target,
} from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, Input, LoadingState, PageHeader, ProgressBar, SectionHeader } from "../components/ui";
import { api } from "../services/api";

function valueOrUnavailable(value) {
  return value === undefined || value === null || value === "" ? "Not available" : value;
}

function countOrUnavailable(items) {
  return Array.isArray(items) ? items.length : "Not available";
}

function ChipList({ items, tone = "blue", emptyLabel }) {
  if (!items?.length) return <p className="job-analyzer-empty-label">{emptyLabel}</p>;

  return (
    <div className="job-analyzer-chip-list">
      {items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>)}
    </div>
  );
}

function JobAnalyzer() {
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.jobAnalyzer.history()
      .then((data) => {
        setHistory(data);
        if (data[0]) setResult(data[0]);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const analyze = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await api.jobAnalyzer.analyze({ jobTitle, jobDescription });
      setResult(data);
      setHistory((current) => [data, ...current]);
    } catch (error) {
      setMessage(error.message || "Job analysis failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <AppShell><LoadingState label="Loading job analyzer" /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Career alignment"
        title="Job Description Analyzer"
        description="Compare a real job description with your current profile to understand skill alignment and preparation priorities."
        action={<Badge tone="violet"><BriefcaseBusiness size={13} /> Career Alignment</Badge>}
      />

      <Card className="job-analyzer-input-card">
        <SectionHeader
          title="Analyze a Job Description"
          description="Paste a real job description to compare its requirements with your SkillGap AI profile."
        />
        <form className="job-analyzer-form" onSubmit={analyze}>
          <Input
            label="Job title"
            hint="Optional"
            placeholder="e.g. Full Stack Developer"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
          />
          <label className="field job-analyzer-description-field">
            <span className="field-label">Job description</span>
            <textarea
              rows={9}
              placeholder="Paste the responsibilities, requirements, and qualifications from a real job description..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              required
            />
          </label>
          {message && (
            <div className="job-analyzer-alert" role="alert">
              <AlertCircle size={17} />
              <div>
                <strong>Unable to analyze this job description</strong>
                <p>{message}</p>
              </div>
            </div>
          )}
          <div className="job-analyzer-form-footer">
            <p className="field-hint">Use a complete job description for the most useful comparison.</p>
            <Button type="submit" icon={Search} disabled={busy}>{busy ? "Analyzing..." : "Analyze Match"}</Button>
          </div>
        </form>
      </Card>

      {!result ? (
        <EmptyState
          icon={FileSearch}
          title="Analyze a Job Description"
          description="Paste a real job description above to see how it aligns with your profile."
        />
      ) : (
        <div className="job-analyzer-report">
          <section className="job-analyzer-section">
            <SectionHeader
              title="Job Overview"
              description="The structured requirements detected in this saved analysis."
            />
            <div className="job-analyzer-overview-grid">
              <div className="job-analyzer-stat">
                <span className="job-analyzer-stat-label">Job title</span>
                <strong>{valueOrUnavailable(result.jobTitle)}</strong>
              </div>
              <div className="job-analyzer-stat">
                <span className="job-analyzer-stat-label">Required skills</span>
                <strong>{countOrUnavailable(result.requiredSkills)}</strong>
              </div>
              <div className="job-analyzer-stat">
                <span className="job-analyzer-stat-label">Important keywords</span>
                <strong>{countOrUnavailable(result.importantKeywords)}</strong>
              </div>
              <div className="job-analyzer-stat">
                <span className="job-analyzer-stat-label">Experience</span>
                <strong>{result.experienceRequirements?.length ? result.experienceRequirements.join(", ") : "Not detected"}</strong>
              </div>
            </div>
          </section>

          <section className="job-analyzer-section">
            <SectionHeader
              title="Profile Alignment"
              description="See how your current profile compares with the requirements in this job description."
            />
            <Card className="job-analyzer-alignment-card">
              <div className="job-analyzer-alignment-main">
                <span className="job-analyzer-icon-box"><Target size={18} /></span>
                <div>
                  <span className="job-analyzer-stat-label">Current profile alignment</span>
                  <strong>{typeof result.profileAlignmentScore === "number" ? `${result.profileAlignmentScore}%` : "Insufficient data"}</strong>
                  <p>{result.profileAlignmentLabel || "The analysis did not provide enough structured skill data for an alignment score."}</p>
                </div>
                {typeof result.profileAlignmentScore === "number" && <ProgressBar value={result.profileAlignmentScore} tone="blue" />}
              </div>
              <div className="job-analyzer-alignment-status">
                <Badge tone={typeof result.profileAlignmentScore === "number" ? "green" : "amber"} dot>
                  {typeof result.profileAlignmentScore === "number" ? result.profileAlignmentLabel : "Insufficient data"}
                </Badge>
              </div>
            </Card>
            <p className="job-analyzer-disclaimer">This indicates preparation alignment, not an employment guarantee.</p>
            <div className="job-analyzer-summary-grid">
              <div><CheckCircle2 size={17} /><span>Matching skills<strong>{countOrUnavailable(result.matchingSkills)}</strong></span></div>
              <div><AlertCircle size={17} /><span>Missing skills<strong>{countOrUnavailable(result.missingSkills)}</strong></span></div>
              <div><Target size={17} /><span>Priority gaps<strong>{countOrUnavailable(result.priorityGaps)}</strong></span></div>
              <div><History size={17} /><span>Saved analyses<strong>{history.length}</strong></span></div>
            </div>
          </section>

          <section className="job-analyzer-section">
            <SectionHeader
              title="Skill Match"
              description="See which job requirements are already supported by your profile and which need preparation."
            />
            <div className="job-analyzer-two-column">
              <Card className="job-analyzer-skill-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box success"><CheckCircle2 size={17} /></span><h3>Matching Skills</h3></div>
                <ChipList items={result.matchingSkills} tone="green" emptyLabel="No matching skills identified" />
              </Card>
              <Card className="job-analyzer-skill-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box warning"><AlertCircle size={17} /></span><h3>Missing Skills</h3></div>
                <ChipList items={result.missingSkills} tone="amber" emptyLabel="No missing skills identified" />
              </Card>
            </div>
          </section>

          <section className="job-analyzer-section">
            <SectionHeader
              title="Priority Preparation"
              description="Focus first on the requirements that have the greatest impact on your target role."
            />
            <div className="job-analyzer-two-column">
              <Card className="job-analyzer-list-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box warning"><Target size={17} /></span><h3>Priority Gaps</h3></div>
                {result.priorityGaps?.length ? (
                  <div className="job-analyzer-priority-list">
                    {result.priorityGaps.map((gap, index) => (
                      <div className="job-analyzer-priority-item" key={gap}>
                        <span className="job-analyzer-index">{String(index + 1).padStart(2, "0")}</span>
                        <div><span className="job-analyzer-stat-label">Skill / requirement</span><strong>{gap}</strong><p>Priority detail not provided by the analysis.</p></div>
                      </div>
                    ))}
                  </div>
                ) : <p className="job-analyzer-empty-label">No priority gaps identified</p>}
              </Card>
              <Card className="job-analyzer-list-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box"><ClipboardCheck size={17} /></span><h3>Recommended Preparation</h3></div>
                {result.recommendedPreparation?.length ? (
                  <div className="job-analyzer-preparation-list">
                    {result.recommendedPreparation.map((item, index) => (
                      <div className="job-analyzer-preparation-item" key={item}><span className="job-analyzer-index">{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>
                    ))}
                  </div>
                ) : <p className="job-analyzer-empty-label">No preparation recommendations available</p>}
              </Card>
            </div>
          </section>

          <section className="job-analyzer-section">
            <SectionHeader
              title="Profile Evidence"
              description="Signals from your saved project and resume data that relate to this analysis."
            />
            <div className="job-analyzer-two-column">
              <Card className="job-analyzer-evidence-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box success"><BriefcaseBusiness size={17} /></span><h3>Skills Demonstrated Through Projects</h3></div>
                <ChipList items={result.demonstratedProjectSkills} tone="violet" emptyLabel="No project evidence available yet" />
              </Card>
              <Card className="job-analyzer-evidence-card">
                <div className="job-analyzer-card-heading"><span className="job-analyzer-icon-box"><Search size={17} /></span><h3>Resume Keywords to Consider</h3></div>
                <p className="job-analyzer-card-description">Keywords that may strengthen alignment when they accurately represent your existing skills.</p>
                <ChipList items={result.usefulResumeKeywords} tone="blue" emptyLabel="No additional resume keywords identified" />
              </Card>
            </div>
          </section>

          <section className="job-analyzer-section">
            <Card className="job-analyzer-alignment-explanation">
              <SectionHeader title="How Your Profile Aligns" description="A concise view of what matches and what to prepare next." />
              <div className="job-analyzer-explanation-grid">
                <div><span className="job-analyzer-stat-label">What matches</span><ChipList items={result.matchingSkills} tone="green" emptyLabel="No matching skills identified" /></div>
                <div><span className="job-analyzer-stat-label">What needs attention</span><ChipList items={result.missingSkills} tone="amber" emptyLabel="No missing skills identified" /></div>
                <div><span className="job-analyzer-stat-label">What to prepare next</span><p>{result.recommendedPreparation?.length ? result.recommendedPreparation[0] : "No preparation recommendation available"}</p></div>
              </div>
            </Card>
          </section>

          <section className="job-analyzer-section">
            <SectionHeader title="Analysis History" description="Your saved job description analyses." />
            <Card className="job-analyzer-history-card">
              {history.length ? history.map((analysis, index) => (
                <div className="job-analyzer-history-item" key={analysis._id || `${analysis.jobTitle}-${index}`}>
                  <span className="job-analyzer-history-number">{index + 1}</span>
                  <div><strong>{valueOrUnavailable(analysis.jobTitle)}</strong><p>{analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : "Saved analysis"}</p></div>
                  {index === 0 && <Badge tone="green">Latest</Badge>}
                </div>
              )) : <p className="job-analyzer-empty-label">No previous analyses</p>}
            </Card>
          </section>
        </div>
      )}
    </AppShell>
  );
}

export default JobAnalyzer;
