import { useEffect, useState } from "react";
import {
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  Pencil,
  School,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader, SectionHeader } from "../components/ui";
import { api } from "../services/api";

function displayValue(value) {
  return value === undefined || value === null || value === "" ? "Not provided" : value;
}

function AccountField({ icon: Icon, label, value, isRole = false }) {
  return (
    <div className="settings-account-field">
      <span className="settings-field-icon"><Icon size={16} /></span>
      <div>
        <span className="settings-field-label">{label}</span>
        {isRole && value ? <Badge tone="violet">{value}</Badge> : <strong className={!value ? "is-missing" : ""}>{displayValue(value)}</strong>}
      </div>
    </div>
  );
}

function Settings() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.settings.get().then(setData).catch((error) => setMessage(error.message));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  if (!data && !message) return <AppShell><LoadingState label="Loading workspace settings" /></AppShell>;
  if (!data) return <AppShell><EmptyState icon={SlidersHorizontal} title="Settings unavailable" description={message} /></AppShell>;

  const account = data.account || {};
  const security = data.security || {};
  const integrations = data.integrations || {};
  const configured = integrations.status === "Configured";

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="Manage your profile, security, AI configuration, and SkillGap AI preferences."
        action={<span className="settings-header-icon" aria-hidden="true"><SlidersHorizontal size={20} /></span>}
      />

      <div className="settings-page-grid">
        <Card className="settings-card settings-account-card">
          <SectionHeader title="Account" description="Your saved profile information." />
          <div className="settings-account-grid">
            <AccountField icon={UserRound} label="Name" value={account.name} />
            <AccountField icon={Mail} label="Email" value={account.email} />
            <AccountField icon={Building2} label="College" value={account.college} />
            <AccountField icon={School} label="Branch" value={account.branch} />
            <AccountField icon={CalendarDays} label="Graduation year" value={account.graduationYear} />
            <AccountField icon={GraduationCap} label="Target role" value={account.targetRole} isRole />
          </div>
          <div className="settings-card-footer">
            <Link className="button button-primary button-md" to="/profile"><Pencil size={15} />Edit Profile</Link>
          </div>
        </Card>

        <div className="settings-secondary-grid">
          <Card className="settings-card">
            <SectionHeader title="Security" description="Manage your authentication and account session." />
            <div className="settings-status-panel security-status">
              <span className="settings-status-icon"><ShieldCheck size={20} /></span>
              <div><strong>{security.authentication || "JWT Authentication"}</strong><p>{security.session || "Your account is securely authenticated."}</p></div>
              <Badge tone="green" dot>Active</Badge>
            </div>
            <div className="settings-info-list">
              <div><KeyRound size={15} /><span>Passwords are securely hashed on the server.</span></div>
              <div><ShieldCheck size={15} /><span>JWT credentials are stored only in this browser session.</span></div>
            </div>
            <div className="settings-card-footer"><Button variant="danger" icon={LogOut} onClick={logout}>Log Out</Button></div>
          </Card>

          <Card className="settings-card">
            <SectionHeader title="AI & Integrations" description="Manage the AI services used by SkillGap AI." />
            <div className="settings-status-panel ai-status">
              <span className="settings-status-icon"><Sparkles size={20} /></span>
              <div><span className="settings-field-label">AI Provider</span><strong>{displayValue(integrations.provider)}</strong><p>AI credentials are securely stored on the server.</p></div>
              <Badge tone={configured ? "green" : "amber"} dot>{displayValue(integrations.status)}</Badge>
            </div>
            <div className="settings-secure-note"><Bot size={15} /><span>Gemini is configured without exposing credentials in this interface.</span></div>
          </Card>
        </div>

        <Card className="settings-card settings-about-card">
          <div className="settings-about-heading">
            <span className="settings-logo-mark"><Sparkles size={20} /></span>
            <div><h2>About SkillGap AI</h2><p>Your transparent career preparation workspace.</p></div>
          </div>
          <p className="settings-about-description">SkillGap AI turns your saved profile, assessments, tests, projects, resume, and target role into a transparent career preparation workspace.</p>
          <div className="settings-about-meta">
            <div><InfoIcon /><span>Version<strong>{displayValue(data.version)}</strong></span></div>
            <div><ShieldCheck size={16} /><span>Security / Privacy<strong>Your personal records remain protected by authenticated access.</strong></span></div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function InfoIcon() {
  return <span className="settings-meta-icon"><CheckCircle2 size={16} /></span>;
}

export default Settings;
