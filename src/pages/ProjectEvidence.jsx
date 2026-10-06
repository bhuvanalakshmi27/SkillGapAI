import { useEffect, useState } from "react";
import { CheckCircle2, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "../layouts/AppShell";
import { Badge, Button, Card, EmptyState, Input, LoadingState, PageHeader } from "../components/ui";
import { api } from "../services/api";

const emptyForm = {
  projectName: "",
  description: "",
  technologies: "",
  skillsDemonstrated: "",
  githubUrl: "",
  liveDemoUrl: "",
  difficulty: "Intermediate",
  status: "in_progress",
};

function ProjectEvidence() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = () => {
    api.projectEvidence.getAll()
      .then(setProjects)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    const payload = {
      ...form,
      technologies: toList(form.technologies),
      skillsDemonstrated: toList(form.skillsDemonstrated),
    };

    try {
      if (editingId) {
        const updated = await api.projectEvidence.update(editingId, payload);
        setProjects((current) => current.map((item) => (item._id === editingId ? updated : item)));
      } else {
        const created = await api.projectEvidence.create(payload);
        setProjects((current) => [created, ...current]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const edit = (project) => {
    setEditingId(project._id);
    setForm({
      projectName: project.projectName,
      description: project.description || "",
      technologies: (project.technologies || []).join(", "),
      skillsDemonstrated: (project.skillsDemonstrated || []).join(", "),
      githubUrl: project.githubUrl || "",
      liveDemoUrl: project.liveDemoUrl || "",
      difficulty: project.difficulty || "Intermediate",
      status: project.status || "in_progress",
    });
  };

  const remove = async (id) => {
    await api.projectEvidence.remove(id);
    setProjects((current) => current.filter((item) => item._id !== id));
  };

  const complete = async (id) => {
    const updated = await api.projectEvidence.complete(id);
    setProjects((current) => current.map((item) => (item._id === id ? updated : item)));
  };

  if (loading) {
    return <AppShell><LoadingState label="Loading project evidence" /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Portfolio evidence"
        title="Project evidence"
        description="Document projects as supporting evidence. This does not automatically prove mastery."
      />

      <Card className="glass-card">
        <form className="form-grid" onSubmit={submit}>
          <Input label="Project name" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Technologies (comma separated)" value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
          <Input label="Skills demonstrated" value={form.skillsDemonstrated} onChange={(e) => setForm({ ...form, skillsDemonstrated: e.target.value })} />
          <Input label="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
          <Input label="Live demo URL" value={form.liveDemoUrl} onChange={(e) => setForm({ ...form, liveDemoUrl: e.target.value })} />
          <label className="field">
            <span className="field-label">Difficulty</span>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          {message && <p className="form-message">{message}</p>}
          <Button type="submit" icon={FilePlus2}>{editingId ? "Update project" : "Add project"}</Button>
        </form>
      </Card>

      {!projects.length ? (
        <EmptyState icon={FilePlus2} title="No projects yet" description="Add portfolio projects to support your career profile." />
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <Card key={project._id}>
              <div className="card-topline">
                <Badge tone="blue">{project.difficulty}</Badge>
                <Badge tone={project.status === "completed" ? "green" : "amber"}>{project.status.replace("_", " ")}</Badge>
              </div>
              <h3>{project.projectName}</h3>
              <p>{project.description}</p>
              <div className="tag-row">{project.skillsDemonstrated?.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
              <div className="button-row">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => edit(project)}>Edit</Button>
                <Button size="sm" icon={CheckCircle2} onClick={() => complete(project._id)}>Mark completed</Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(project._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default ProjectEvidence;
