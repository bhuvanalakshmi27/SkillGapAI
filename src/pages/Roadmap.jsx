import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlaskConical,
  Map,
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader, ProgressBar, SectionHeader } from "../components/ui";
import { api } from "../services/api";

function priorityTone(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "amber";
  if (priority === "Assessment Required") return "amber";
  return "blue";
}

function statusFor(item, activeId) {
  if (item.isCompleted) return { label: "Completed", tone: "green", icon: CheckCircle2 };
  if (item._id === activeId) return { label: "In progress", tone: "blue", icon: PlayCircle };
  if (item.priority === "Assessment Required") return { label: "Assessment required", tone: "amber", icon: FlaskConical };
  return { label: "Upcoming", tone: "blue", icon: Clock3 };
}

function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [activeId, setActiveId] = useState(null);

  const load = () => {
    setLoading(true);
    api.roadmap.get()
      .then((data) => {
        setRoadmap(data);
        setActiveId(data.continueItem?._id || data.nextItem?._id || null);
      })
      .catch((error) => {
        setRoadmap(null);
        setMessage(error.message || "No roadmap yet.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const activeItem = useMemo(
    () => roadmap?.items?.find((item) => item._id === activeId) || roadmap?.continueItem || roadmap?.nextItem,
    [roadmap, activeId]
  );

  const generate = async () => {
    setBusy("generate");
    setMessage("");
    try {
      const data = await api.roadmap.generate();
      setRoadmap(data);
      setActiveId(data.continueItem?._id || data.items?.[0]?._id);
    } catch (error) {
      setMessage(error.message || "Unable to generate roadmap");
    } finally {
      setBusy("");
    }
  };

  const resume = async () => {
    setBusy("resume");
    try {
      const data = await api.roadmap.continue();
      setRoadmap(data);
      setActiveId(data.continueItem?._id);
    } catch (error) {
      setMessage(error.message || "Unable to resume roadmap");
    } finally {
      setBusy("");
    }
  };

  const toggleItem = async (itemId, isCompleted) => {
    setBusy(itemId);
    try {
      const data = await api.roadmap.toggleItem(itemId, isCompleted);
      setRoadmap(data);
      setActiveId(data.continueItem?._id || itemId);
    } catch (error) {
      setMessage(error.message || "Unable to update item");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <AppShell><LoadingState label="Loading your learning roadmap" /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Personalized learning"
        title="Weekly Learning Roadmap"
        description="Your personalized step-by-step learning plan based on your target role, skill gaps, priorities, and assessed confidence."
        action={<div className="button-row roadmap-header-actions">{roadmap && <Button variant="secondary" icon={PlayCircle} onClick={resume} disabled={busy === "resume"}>Continue</Button>}<Button icon={Sparkles} onClick={generate} disabled={busy === "generate"}>{busy === "generate" ? "Generating..." : roadmap ? "Regenerate" : "Generate roadmap"}</Button></div>}
      />

      {message && !roadmap && (
        <Card className="notice-card roadmap-notice">
          <p>{message}</p>
          <Button icon={Map} onClick={generate} disabled={busy === "generate"}>{busy === "generate" ? "Generating..." : "Generate from my skill gaps"}</Button>
        </Card>
      )}

      {roadmap && (
        <>
          <Card className="roadmap-overview-card">
            <div className="roadmap-overview-top">
              <div><span className="eyebrow">Target role</span><h2>{roadmap.targetRole}</h2><p>Complete weekly learning tasks to improve your career readiness.</p></div>
              <div className="roadmap-overview-progress"><span className="roadmap-label">Overall progress</span><strong>{typeof roadmap.progressPercentage === "number" ? `${roadmap.progressPercentage}%` : "Progress not available"}</strong>{typeof roadmap.progressPercentage === "number" && <ProgressBar value={roadmap.progressPercentage} tone="blue" />}</div>
            </div>
            <div className="roadmap-overview-stats">
              <div><span>Weeks planned</span><strong>{roadmap.items?.length ?? "Not available"}</strong></div>
              <div><span>Current week</span><strong>{activeItem?.weekNumber ? `Week ${activeItem.weekNumber}` : "Not available"}</strong></div>
              <div><span>Current focus</span><strong>{activeItem?.skillName || "Not available"}</strong></div>
            </div>
          </Card>

          <section className="roadmap-section">
            <SectionHeader title="Your Learning Journey" description="Move through each real roadmap week at your own pace." />
            <div className="roadmap-journey">
              {roadmap.items?.map((item) => {
                const status = statusFor(item, activeId);
                const StatusIcon = status.icon;
                return <button type="button" className={`roadmap-journey-item ${item._id === activeId ? "is-active" : ""} ${item.isCompleted ? "is-complete" : ""}`} key={item._id} onClick={() => setActiveId(item._id)} aria-label={`View week ${item.weekNumber}: ${item.skillName}`}>
                  <span className="roadmap-journey-node">{item.isCompleted ? <Check size={15} /> : item.weekNumber}</span>
                  <span className="roadmap-journey-copy"><b>Week {item.weekNumber}</b><strong>{item.skillName}</strong><small>{item.estimatedDurationHours}h · {status.label} <StatusIcon size={11} /></small></span>
                  <ChevronRight size={16} />
                </button>;
              })}
            </div>
          </section>

          {activeItem && (
            <section className="roadmap-section">
              <Card className="roadmap-current-card">
                <div className="roadmap-current-heading">
                  <div className="roadmap-current-icon"><Target size={22} /></div>
                  <div><span className="eyebrow">Continue learning · Week {activeItem.weekNumber}</span><h2>{activeItem.skillName}</h2><p>{activeItem.title}</p></div>
                  <Badge tone={priorityTone(activeItem.priority)}>{activeItem.priority}</Badge>
                </div>
                <div className="roadmap-current-meta"><span><Clock3 size={15} /> {activeItem.estimatedDurationHours} hours</span><span>{statusFor(activeItem, activeId).label}</span>{activeItem.isCompleted && <Badge tone="green" dot>Completed</Badge>}</div>
                <div className="roadmap-learning-flow"><span><BookOpen size={15} /> Learn</span><ChevronRight size={14} /><span><FlaskConical size={15} /> Practice</span><ChevronRight size={14} /><span><Rocket size={15} /> Build</span><ChevronRight size={14} /><span><CheckCircle2 size={15} /> Complete</span></div>
                <div className="roadmap-current-grid">
                  <div className="roadmap-detail-block"><h3>Why you're learning this</h3><p>This skill is part of your personalized roadmap for your target role.</p></div>
                  <div className="roadmap-detail-block"><h3>Learning Objectives</h3><ContentList items={activeItem.learningObjectives} numbered emptyLabel="No learning objectives provided." /></div>
                  <div className="roadmap-detail-block"><h3>What to Study</h3><ChipList items={activeItem.recommendedTopics} emptyLabel="No study topics provided." /></div>
                  <div className="roadmap-detail-block"><h3>Practice Tasks</h3><ContentList items={activeItem.practicalExercises} emptyLabel="No practice tasks provided." /></div>
                  <div className="roadmap-project-block"><div><Rocket size={18} /><h3>Mini Project</h3></div><p>{activeItem.miniProject || "No mini project provided."}</p></div>
                </div>
                <div className="roadmap-complete-footer"><p>{activeItem.isCompleted ? "This week is marked complete." : "Complete the week's learning activities before moving forward."}</p><Button icon={CheckCircle2} onClick={() => toggleItem(activeItem._id, !activeItem.isCompleted)} disabled={busy === activeItem._id}>{activeItem.isCompleted ? "Mark Week Incomplete" : "Mark Week Complete"}</Button></div>
              </Card>
            </section>
          )}

          <section className="roadmap-section">
            <SectionHeader title="Upcoming Weeks" description="Select any week to review its learning plan." />
            <div className="roadmap-week-grid">{roadmap.items?.map((item) => { const status = statusFor(item, activeId); const StatusIcon = status.icon; return <Card className={`roadmap-week-card ${item._id === activeId ? "is-selected" : ""} ${item.isCompleted ? "is-complete" : ""}`} key={item._id}><div className="roadmap-week-card-top"><span className="roadmap-week-number">Week {item.weekNumber}</span><Badge tone={status.tone}><StatusIcon size={12} /> {status.label}</Badge></div><h3>{item.skillName}</h3><p>{item.title}</p><div className="roadmap-week-card-meta"><span><Clock3 size={14} /> {item.estimatedDurationHours} hours</span><Badge tone={priorityTone(item.priority)}>{item.priority}</Badge></div><Button variant="secondary" size="sm" onClick={() => setActiveId(item._id)}>View week</Button></Card>; })}</div>
          </section>
        </>
      )}

      {!roadmap && !message && <EmptyState icon={Map} title="Your learning roadmap isn't available yet" description="Run skill gap analysis first, then generate a personalized weekly plan." action={<Button icon={Sparkles} onClick={generate} disabled={busy === "generate"}>{busy === "generate" ? "Generating..." : "Generate roadmap"}</Button>} />}
    </AppShell>
  );
}

function ContentList({ items, numbered = false, emptyLabel }) {
  if (!items?.length) return <p className="roadmap-empty-copy">{emptyLabel}</p>;
  return <div className="roadmap-content-list">{items.map((item, index) => <div key={item}><span>{numbered ? String(index + 1).padStart(2, "0") : <Check size={14} />}</span><p>{item}</p></div>)}</div>;
}

function ChipList({ items, emptyLabel }) {
  if (!items?.length) return <p className="roadmap-empty-copy">{emptyLabel}</p>;
  return <div className="roadmap-topic-list">{items.map((item) => <Badge key={item} tone="blue">{item}</Badge>)}</div>;
}

export default Roadmap;
