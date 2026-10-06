import { useEffect, useState } from "react";
import { Bookmark, CheckCircle2, Clock3, Lightbulb, Play, Sparkles, Target, Wrench } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, Modal, PageHeader } from "../components/ui";
import { api } from "../services/api";

function ProjectRecommendations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [profileRole, setProfileRole] = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      api.projectRecommendations.getAll(),
      api.profile.get("me"),
    ])
      .then(([recommendationsResult, profileResult]) => {
        if (recommendationsResult.status === "fulfilled") {
          setItems(recommendationsResult.value);
        } else {
          setMessage(recommendationsResult.reason.message);
        }
        if (profileResult.status === "fulfilled") {
          setProfileRole(profileResult.value.targetRole || "");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Fetch initial recommendations when the page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const generate = async () => {
    setBusy(true);
    setMessage("");
    try {
      const data = await api.projectRecommendations.generate();
      setItems(data);
    } catch (error) {
      setMessage(error.message || "Failed to generate recommendations");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      const updated = await api.projectRecommendations.updateStatus(id, status);
      setItems((current) => current.map((item) => (item._id === id ? updated : item)));
      if (selected?._id === id) setSelected(updated);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const targetRole = items.find((item) => item.targetRole)?.targetRole || profileRole;

  const renderChips = (values, tone = "blue", emptyLabel = "Not available") => (
    values?.length ? (
      <div className="recommendation-chips">
        {values.map((value) => <Badge key={value} tone={tone}>{value}</Badge>)}
      </div>
    ) : <span className="field-hint">{emptyLabel}</span>
  );

  if (loading) {
    return <AppShell><LoadingState label="Loading project recommendations" /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Portfolio planning"
        title="AI Project Recommendations"
        description="Personalized projects based on your gaps, confidence scores, roadmap, and existing evidence."
        action={<Button icon={Sparkles} onClick={generate} disabled={busy}>Generate recommendations</Button>}
      />

      {message && <Card className="notice-card"><p>{message}</p></Card>}

      <Card className="recommendation-context">
        <div className="context-item">
          <span className="context-icon"><Target size={16} /></span>
          <div><span className="context-label">Target role</span><strong>{targetRole || "Not available"}</strong></div>
        </div>
        <div className="context-divider" />
        <div className="context-item">
          <span className="context-icon"><Wrench size={16} /></span>
          <div><span className="context-label">Recommendation basis</span><strong>Skill gaps <span>•</span> Confidence <span>•</span> Roadmap <span>•</span> Evidence</strong></div>
        </div>
      </Card>

      {!items.length ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations yet"
          description="Generate projects aligned to your documented skill gaps."
          action={<Button icon={Sparkles} onClick={generate}>Generate</Button>}
        />
      ) : (
        <>
          <div className="recommendation-grid">
          {items.map((item) => (
            <Card key={item._id} className="recommendation-card">
              <div className="recommendation-card-header">
                <div className="recommendation-badges">
                <Badge tone="blue">{item.difficulty}</Badge>
                <Badge tone="green">{item.status.replace("_", " ")}</Badge>
                </div>
                <span className="recommendation-effort"><Clock3 size={14} />{item.estimatedEffortHours}h effort</span>
              </div>
              <div className="recommendation-card-title">
                <h2>{item.title}</h2>
                <p>{item.description || "No description available."}</p>
              </div>
              <div className="recommendation-meta">
                <div><span>Target role</span><strong>{item.targetRole || "Not available"}</strong></div>
                <div><span>Estimated effort</span><strong>{item.estimatedEffortHours ? `${item.estimatedEffortHours}h` : "Not available"}</strong></div>
              </div>
              <div className="recommendation-section">
                <span className="recommendation-section-label">Related skill gaps</span>
                {renderChips(item.relatedSkillGaps, "red")}
              </div>
              <div className="recommendation-section">
                <span className="recommendation-section-label">Skills practiced</span>
                {renderChips(item.skillsPracticed)}
              </div>
              <div className="recommendation-actions">
                <Button size="sm" variant="secondary" onClick={() => setSelected(item)}>View details</Button>
                {item.status === "recommended" && <Button size="sm" variant="ghost" icon={Bookmark} onClick={() => setStatus(item._id, "saved")}>Save project</Button>}
                {item.status === "saved" && <Button size="sm" icon={Play} onClick={() => setStatus(item._id, "in_progress")}>Start project</Button>}
                {item.status === "in_progress" && <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setStatus(item._id, "completed")}>Mark completed</Button>}
              </div>
            </Card>
          ))}
          </div>
        </>
      )}

      <Modal open={Boolean(selected)} title="AI project recommendation" onClose={() => setSelected(null)}>
        {selected && (
          <div className="recommendation-details">
            <div className="recommendation-detail-intro">
              <h3>{selected.title}</h3>
              <p>{selected.description || "No description available."}</p>
            </div>
            <div className="recommendation-detail-block"><h4>Why this project is recommended</h4><p>{selected.whyRecommended || "Not available"}</p></div>
            <div className="recommendation-detail-block"><h4>Expected outcome</h4><p>{selected.expectedOutcome || "Not available"}</p></div>
            <div className="recommendation-detail-block"><h4>Skills practiced</h4>{renderChips(selected.skillsPracticed)}</div>
            <div className="recommendation-detail-block"><h4>Related skill gaps</h4>{renderChips(selected.relatedSkillGaps, "red")}</div>
            <div className="recommendation-detail-block"><h4>Target role</h4><p>{selected.targetRole || "Not available"}</p></div>
            <div className="recommendation-detail-block"><h4>Target-role relationship</h4><p>{selected.targetRoleRelationship || "Not available"}</p></div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

export default ProjectRecommendations;
