import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Briefcase,
  ChevronDown,
  FilePlus2,
  FileText,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings2,
  Shield,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";

const navItems = [
  { label: "Overview", to: "/overview", icon: LayoutDashboard },
  { label: "My profile", to: "/profile", icon: UserRound },
  { label: "Skill assessment", to: "/skill-assessment", icon: Target },
  { label: "Skill test", to: "/skill-test", icon: FlaskConical },
  { label: "Skill gap", to: "/skill-gap", icon: Target },
  { label: "Learning roadmap", to: "/roadmap", icon: Map },
  { label: "Project recommendations", to: "/project-recommendations", icon: Sparkles },
  { label: "Project evidence", to: "/project-evidence", icon: FilePlus2 },
  { label: "Resume analysis", to: "/resume-analysis", icon: FileText },
  { label: "Job analyzer", to: "/job-analyzer", icon: Briefcase },
  { label: "Career readiness", to: "/career-readiness", icon: Gauge },
  { label: "Weekly progress", to: "/weekly-progress", icon: Activity },
];

const manageItems = [
  { label: "Settings", to: "/settings", icon: Settings2 },
];

function Brand() {
  return (
    <Link className="brand" to="/overview">
      <span className="brand-mark"><Sparkles size={18} fill="currentColor" /></span>
      <span>SkillGap <b>AI</b></span>
    </Link>
  );
}

export function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    api.profile.get("me")
      .then((data) => setAccount(data))
      .catch(() => setAccount(null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setAccountOpen(false);
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  const displayName = account?.name || "Student";
  const displayEmail = account?.email || "Email unavailable";
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className="sidebar-link" onClick={onNavigate}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-label sidebar-label-lower">Manage</div>
      <nav className="sidebar-nav">
        {manageItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar-link" onClick={onNavigate}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
        {localStorage.getItem("userRole") === "admin" && (
          <NavLink to="/admin" className="sidebar-link" onClick={onNavigate}>
            <Shield size={18} strokeWidth={1.8} />
            <span>Admin dashboard</span>
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="account-wrap">
          <button className="sidebar-account" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)}>
            <span className="avatar">{initials}</span>
            <span><strong>{displayName}</strong><small>Student</small></span>
            <ChevronDown size={16} />
          </button>
          {accountOpen && (
            <div className="account-menu" role="menu">
              <div className="account-menu-header"><span className="avatar">{initials}</span><span><strong>{displayName}</strong><small>{displayEmail}</small><em>Student</em></span></div>
              <div className="account-menu-divider" />
              <Link to="/profile" className="account-menu-item" onClick={onNavigate} role="menuitem"><UserRound size={15} /> My Profile</Link>
              <button className="account-menu-item account-menu-logout" type="button" onClick={handleLogout} role="menuitem"><LogOut size={15} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function Navbar({ onMenu }) {
  const location = useLocation();
  const labels = {
    "/overview": "Overview",
    "/profile": "My profile",
    "/skill-assessment": "Skill assessment",
    "/skill-test": "Skill test",
    "/skill-gap": "Skill gap analysis",
    "/roadmap": "Learning roadmap",
    "/project-recommendations": "Project recommendations",
    "/project-evidence": "Project evidence",
    "/resume-analysis": "Resume analysis",
    "/job-analyzer": "Job analyzer",
    "/career-readiness": "Career readiness",
    "/weekly-progress": "Weekly progress",
    "/settings": "Settings",
    "/admin": "Admin dashboard",
  };
  const pageLabel = labels[location.pathname] || "Workspace";

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="mobile-brand"><Brand /></div>
      <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{pageLabel}</strong></div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="View notifications"><Bell size={18} /></button>
        <span className="topbar-divider" />
        <div className="topbar-user"><span className="avatar avatar-small">SG</span><span>Student</span></div>
      </div>
    </header>
  );
}

export function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-frame">
      <div className={`sidebar-overlay ${sidebarOpen ? "is-visible" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`mobile-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <button className="mobile-sidebar-close icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      <Sidebar />
      <div className="app-main">
        <Navbar onMenu={() => setSidebarOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export function AuthLayout({ children, mode = "login" }) {
  const isRegister = mode === "register";
  return (
    <div className="auth-frame">
      <div className="auth-visual">
        <Link className="brand auth-brand" to="/"><span className="brand-mark"><Sparkles size={18} fill="currentColor" /></span><span>SkillGap <b>AI</b></span></Link>
        <div className="auth-visual-copy">
          <p className="eyebrow">Your career, with clarity</p>
          <h1>Turn potential<br /><em>into progress.</em></h1>
          <p>Know your skills. Close your gaps. Build the career you are ready for.</p>
        </div>
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
      </div>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand"><Link className="brand" to="/"><span className="brand-mark"><Sparkles size={18} fill="currentColor" /></span><span>SkillGap <b>AI</b></span></Link></div>
          <div className="auth-heading">
            <p className="eyebrow">{isRegister ? "Start your journey" : "Welcome back"}</p>
            <h2>{isRegister ? "Build your career edge." : "Pick up where you left off."}</h2>
            <p>{isRegister ? "Set up your workspace in less than a minute." : "Your next opportunity is closer than you think."}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DemoFooter() {
  return <p className="auth-footnote">Protected workspace <span>•</span> Built for ambitious students</p>;
}
