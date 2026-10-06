import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Inbox,
  LoaderCircle,
  X,
} from "lucide-react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconAfter = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} button-${size} ${className}`}
      {...props}
    >
      {!iconAfter && Icon && <Icon size={16} strokeWidth={2} />}
      {children}
      {iconAfter && Icon && <Icon size={16} strokeWidth={2} />}
    </button>
  );
}

export function Card({ children, className = "", ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "blue", dot = false }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function Input({ label, hint, icon: Icon, className = "", ...props }) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="field-label">{label}</span>}
      <span className="input-wrap">
        {Icon && <Icon className="input-icon" size={17} strokeWidth={1.8} />}
        <input {...props} />
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function ProgressBar({ value, tone = "blue" }) {
  return (
    <div className="progress-track" aria-label={`${value}% complete`}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function LoadingState({ label = "Loading your workspace" }) {
  return (
    <div className="state-panel">
      <LoaderCircle className="spin" size={24} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", description, action, icon: Icon = Inbox }) {
  return (
    <div className="state-panel empty-state">
      <span className="empty-icon"><Icon size={22} /></span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function MetricCard({ label, value, detail, trend, icon: Icon }) {
  return (
    <Card className="metric-card">
      <div className="metric-topline">
        <span className="metric-icon"><Icon size={18} /></span>
        {trend && <Badge tone="green" dot>{trend}</Badge>}
      </div>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      {detail && <p className="metric-detail">{detail}</p>}
    </Card>
  );
}

export function ChecklistItem({ title, detail, complete = false }) {
  return (
    <div className={`checklist-item ${complete ? "is-complete" : ""}`}>
      <span className="check-icon">{complete ? <Check size={14} /> : <CircleHelp size={15} />}</span>
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <ChevronRight className="check-arrow" size={16} />
    </div>
  );
}

export function LinkArrow() {
  return <ArrowUpRight size={16} strokeWidth={2} />;
}

export function FileIcon() {
  return <FileText size={18} strokeWidth={1.8} />;
}
