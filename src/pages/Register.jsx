import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AuthLayout, DemoFooter } from "../layouts/AppShell";
import { Button, Input } from "../components/ui";
import { api } from "../services/api";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

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
      const data = await api.auth.register(formData);

      setMessage(data.message || "Registration successful! You can now log in.");
      setFormData({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
    }
  };

  return (
    <AuthLayout mode="register">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input label="Full name" icon={UserRound} type="text" name="name" placeholder="Alex Morgan" value={formData.name} onChange={handleChange} required autoComplete="name" />
        <Input label="University email" icon={Mail} type="email" name="email" placeholder="you@university.edu" value={formData.email} onChange={handleChange} required autoComplete="email" />
        <Input label="Create password" icon={LockKeyhole} type="password" name="password" placeholder="At least 6 characters" value={formData.password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
        {message && <div className={`form-message ${message.toLowerCase().includes("successful") ? "is-success" : ""}`} role="status">{message}</div>}
        <Button type="submit" icon={ArrowRight} iconAfter className="button-full">Create my workspace</Button>
        <div className="auth-trust"><ShieldCheck size={15} /> Your data is private and secure</div>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      <DemoFooter />
    </AuthLayout>
  );
}

export default Register;