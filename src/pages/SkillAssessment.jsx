import { useEffect, useState } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, Input, PageHeader } from "../components/ui";
import { api } from "../services/api";

const DEFAULT_SKILLS = ["HTML", "CSS", "JavaScript", "React", "Python", "Java", "SQL", "Git", "Node.js", "Express.js", "Databases"];

function SkillAssessment() {
  const [availableSkills, setAvailableSkills] = useState(DEFAULT_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.skillTests.getAvailable().catch(() => []),
      api.profile.get("me").catch(() => null),
    ]).then(([tests, profile]) => {
      const skillsSet = new Set(DEFAULT_SKILLS);
      if (Array.isArray(tests)) {
        tests.forEach((s) => skillsSet.add(s));
      }
      if (profile && Array.isArray(profile.skills)) {
        profile.skills.forEach((s) => skillsSet.add(s));
      }
      setAvailableSkills(Array.from(skillsSet).sort());
    });
  }, []);

  useEffect(() => {
    if (!selectedSkill) return;

    api.skillAssessment.getBySkill(selectedSkill, "me")
      .then((current) => {
        if (current) {
          setRating(String(current.selfRating));
          setNotes(current.notes || "");
        }
      })
      .catch(() => {});
  }, [selectedSkill]);

  const handleSkillChange = (event) => {
    setSelectedSkill(event.target.value);
    setRating("");
    setNotes("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSkill || rating === "") {
      setMessage("Please select a skill and enter a self-assessment score (0–100)");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await api.skillAssessment.save({
        skillName: selectedSkill,
        selfRating: Number(rating),
        notes,
      });

      setMessage("Self-assessment saved successfully!");
    } catch (error) {
      setMessage(error.message || "Unable to save self-assessment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student skill assessment"
        title="Skill Assessment"
        description="Rate your current confidence level in each skill."
      />
      <Card className="assessment-card">
        <div className="assessment-heading">
          <span className="dashboard-icon"><ClipboardCheck size={20} /></span>
          <div><p className="card-kicker">Self assessment</p><h2>Rate your current confidence.</h2></div>
          <Badge tone="violet">Step 1</Badge>
        </div>
        <p className="assessment-explanation">
          This is your self-assessment estimate. Your final Skill Confidence Score will combine this rating (40%) with your Mini Skill Test result (60%).
        </p>
        <form className="assessment-form" onSubmit={handleSubmit}>
          <label className="assessment-select-field">
            <span className="field-label">Select skill</span>
            <select value={selectedSkill} onChange={handleSkillChange}>
              <option value="">Choose a skill</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </label>
          <Input
            label="Self-assessment score"
            type="number"
            min="0"
            max="100"
            placeholder="0–100"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            hint="Confidence rating from 0 (beginner/unfamiliar) to 100 (expert/proficient)."
          />
          <label className="assessment-notes">
            <span className="field-label">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What concepts can you build, explain, or work with?"
              rows="4"
            />
          </label>
          {message && (
            <div className={`form-message ${message.toLowerCase().includes("success") ? "is-success" : ""}`} role="status">
              {message}
            </div>
          )}
          <div className="form-actions">
            <Button type="submit" icon={Save} disabled={saving}>
              {saving ? "Saving..." : "Save assessment"}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

export default SkillAssessment;
