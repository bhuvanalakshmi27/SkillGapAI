import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Code2, GraduationCap, UserRound } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Button, Card, Input, PageHeader } from "../components/ui";
import { api } from "../services/api";

function Profile() {
  const [formData, setFormData] = useState({
    college: "",
    branch: "",
    graduationYear: "",
    targetRole: "",
    skills: "",
  });

  const [careerRoles, setCareerRoles] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.profile.get("me").catch(() => null),
      api.careerRoles.getAll().catch(() => []),
    ]).then(([profile, roles]) => {
      if (profile) {
        setFormData({
          college: profile.college || "",
          branch: profile.branch || "",
          graduationYear: profile.graduationYear ? String(profile.graduationYear) : "",
          targetRole: profile.targetRole || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
        });
      }
      if (roles) {
        setCareerRoles(roles);
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...formData,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      const data = await api.profile.update("me", payload);
      setMessage(data.message || "Profile updated successfully");
    } catch (error) {
      setMessage(error.message || "Unable to save profile");
    }
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Your foundation" title="Build your career profile." description="Give SkillGap AI the context it needs to turn your goals into a focused plan." />
      <div className="profile-layout">
        <Card className="profile-form-card">
          <div className="profile-card-heading"><span className="section-icon"><UserRound size={20} /></span><div><h2>About you</h2><p>Start with the details that shape your career path.</p></div></div>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <Input label="College or university" icon={Building2} name="college" placeholder="e.g. Stanford University" value={formData.college} onChange={handleChange} />
              <Input label="Branch or major" icon={GraduationCap} name="branch" placeholder="e.g. Computer Science" value={formData.branch} onChange={handleChange} />
              <Input label="Graduation year" icon={CalendarDays} type="number" name="graduationYear" placeholder="2027" value={formData.graduationYear} onChange={handleChange} />
              <label className="assessment-select-field">
                <span className="field-label">Target career role</span>
                <select name="targetRole" value={formData.targetRole} onChange={handleChange}>
                  <option value="">Select target role</option>
                  {careerRoles.map((role) => (
                    <option key={role._id || role.title} value={role.title}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Your Skill Gap Analysis will compare required levels for this role.</span>
              </label>
            </div>
            <Input label="Current skills" hint="Separate skills with commas. e.g. HTML, CSS, JavaScript, React" icon={Code2} name="skills" placeholder="HTML, CSS, JavaScript, React" value={formData.skills} onChange={handleChange} />
            {message && <div className={`form-message ${message.toLowerCase().includes("success") ? "is-success" : ""}`} role="status">{message}</div>}
            <div className="form-actions"><Button type="submit" icon={ArrowRight} iconAfter>Save and continue</Button></div>
          </form>
        </Card>
        <Card className="profile-progress-card">
          <div className="profile-progress-orb"><span>—</span><small>{formData.targetRole ? "set" : "pending"}</small></div>
          <p className="eyebrow">Target career</p>
          <h2>{formData.targetRole || "Target role not set"}</h2>
          <p>{formData.targetRole ? `Your workspace is configured for ${formData.targetRole}. Run Skill Gap Analysis next.` : "Select a target role to unlock personalized gap analysis and learning recommendations."}</p>
          <div className="profile-pending-status"><span className="status-dot" />{formData.targetRole ? "Target role configured" : "Target role selection required"}</div>
          <div className="profile-progress-label"><span>Target role</span><strong>{formData.targetRole || "Not selected"}</strong></div>
          <div className="profile-tips"><span>Next up</span><strong>Skill Gap Analysis</strong><small>Run analysis from Overview once your role and skills are saved.</small></div>
        </Card>
      </div>
    </AppShell>
  );
}

export default Profile;