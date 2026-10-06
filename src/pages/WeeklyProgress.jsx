import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, BriefcaseBusiness, CheckCircle2, ClipboardCheck, FileText, History, Search, Target, TestTube2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../layouts/AppShell";
import { Badge, Card, EmptyState, LoadingState, PageHeader, SectionHeader } from "../components/ui";
import { api } from "../services/api";

const filters = [
  ["all", "All"], ["skill_assessment", "Assessments"], ["skill_test", "Tests"], ["roadmap", "Roadmap"],
  ["project_evidence", "Projects"], ["resume_analysis", "Resume"], ["job_analysis", "Job Analysis"],
];
const eventIcons = { skill_assessment: ClipboardCheck, skill_test: TestTube2, roadmap: BookOpen, project_evidence: BriefcaseBusiness, resume_analysis: FileText, job_analysis: Search };
const eventLabels = { skill_assessment: "Skill assessment", skill_test: "Mini test", roadmap: "Roadmap update", project_evidence: "Project evidence", resume_analysis: "Resume analysis", job_analysis: "Job analysis" };

function groupActivities(events) {
  return events.reduce((groups, event) => {
    const previous = groups[groups.length - 1];
    const closeInTime = previous && previous.type === event.type && previous.title === event.title
      && Math.abs(new Date(previous.occurredAt) - new Date(event.occurredAt)) <= 10000;
    if (closeInTime) {
      previous.count += 1;
      return groups;
    }
    groups.push({ ...event, count: 1 });
    return groups;
  }, []);
}

function WeeklyProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.progress.get().then(setData).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  const filteredActivities = useMemo(() => {
    const activities = (data?.recentActivities || []).filter((event) => filter === "all" || event.type === filter);
    return groupActivities(activities);
  }, [data, filter]);

  if (loading) return <AppShell><LoadingState label="Loading progress history" /></AppShell>;
  if (!data) return <AppShell><EmptyState icon={Activity} title="No progress data" description={message} /></AppShell>;

  const weeklyChart = (data.weeklyProgress || []).map((week) => ({ week: new Date(week.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" }), activities: week.activities }));
  const confidenceChart = (data.confidenceTrend || []).slice(0, 12);
  const totals = data.totals || {};

  return (
    <AppShell>
      <PageHeader eyebrow="Learning consistency" title="Weekly Progress" description="See how consistently you're building skills and completing career-preparation activities." />

      <section className="progress-section">
        <SectionHeader title="Progress Snapshot" description="A summary of the activity recorded across your workspace." />
        <div className="progress-stats-grid">
          {[["Tracked events", totals.events, Activity], ["Mini tests", totals.tests, TestTube2], ["Skills with confidence", totals.trackedSkills, Target], ["Skills assessed", totals.skillsAssessed, CheckCircle2], ["Projects completed", totals.projectsCompleted, BriefcaseBusiness], ["Roadmap progress", totals.roadmapProgress === null ? "Not available" : `${totals.roadmapProgress}%`, BookOpen]].map(([label, value, Icon]) => (
            <Card className="progress-stat-card" key={label}><span className="progress-stat-icon"><Icon size={17} /></span><span>{label}</span><strong>{value ?? "Not available"}</strong></Card>
          ))}
        </div>
      </section>

      <section className="progress-section">
        <Card className="progress-chart-card">
          <SectionHeader title="Weekly Activity" description="Learning and career-preparation events recorded over time." />
          {weeklyChart.length ? <div className="chart-wrap progress-chart-wrap"><ResponsiveContainer width="100%" height={280}><BarChart data={weeklyChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="week" stroke="#7f8aa5" tickLine={false} axisLine={false} /><YAxis stroke="#7f8aa5" allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#111a35", border: "1px solid rgba(143,158,204,.25)", borderRadius: 8 }} /><Bar dataKey="activities" name="Activities" fill="#8098ff" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState icon={Activity} title="No weekly activity yet" description="Complete assessments, roadmap tasks, or projects to populate trends." />}
        </Card>
      </section>

      <section className="progress-section">
        <Card className="progress-chart-card">
          <SectionHeader title="Skill Confidence" description="Current confidence across assessed skills." />
          {confidenceChart.length ? <div className="chart-wrap progress-chart-wrap"><ResponsiveContainer width="100%" height={280}><LineChart data={confidenceChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="skill" stroke="#7f8aa5" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} stroke="#7f8aa5" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#111a35", border: "1px solid rgba(143,158,204,.25)", borderRadius: 8 }} /><Line type="monotone" dataKey="confidence" name="Confidence" stroke="#71e1b4" strokeWidth={2} dot={{ r: 3, fill: "#71e1b4" }} /></LineChart></ResponsiveContainer></div> : <EmptyState icon={Target} title="No skill confidence data yet" description="Complete a skill assessment and mini test to generate confidence data." />}
        </Card>
      </section>

      <section className="progress-section">
        <SectionHeader title="Recent Activity" description="Your latest recorded learning and career-preparation events." />
        <div className="progress-filter-bar" role="group" aria-label="Filter recent activity">{filters.map(([value, label]) => <button className={`button button-sm ${filter === value ? "button-primary" : "button-ghost"}`} type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}</button>)}</div>
        {filteredActivities.length ? <div className="progress-timeline">{filteredActivities.map((event) => { const Icon = eventIcons[event.type] || History; return <div className="progress-timeline-item" key={`${event.type}-${event.occurredAt}-${event.title}`}><span className="progress-timeline-icon"><Icon size={16} /></span><div><strong>{event.title || eventLabels[event.type] || "Activity recorded"}</strong><div className="progress-event-meta"><Badge tone="blue">{eventLabels[event.type] || event.type}</Badge>{event.count > 1 && <span>{event.count} activity events</span>}<time>{new Date(event.occurredAt).toLocaleString()}</time></div></div></div>; })}</div> : <EmptyState icon={History} title="No activity recorded yet" description="Your assessments, projects, roadmap updates and analyses will appear here." />}
      </section>
    </AppShell>
  );
}

export default WeeklyProgress;
