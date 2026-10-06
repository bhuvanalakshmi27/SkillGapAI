import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { AuthLayout, DemoFooter } from "../layouts/AppShell";
import { Button, Input } from "../components/ui";
import { api } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSuccess(false);
    setMessage("");
    setSubmitting(true);

    try {
      const data = await api.auth.login(formData);

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userRole", data.user.role || "student");
        navigate("/overview", { replace: true });
        return;
      }

      throw new Error("Login response was incomplete. Please try again.");
    } catch (error) {
      setMessage(error.message || "Unable to connect to server");
      setIsSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <Input label="Email address" icon={Mail} type="email" name="email" placeholder="you@university.edu" value={formData.email} onChange={handleChange} required autoComplete="email" />
        <Input label="Password" icon={LockKeyhole} type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
        <div className="form-row form-row-end"><button className="text-button" type="button">Forgot password?</button></div>
        {message && <div className={`form-message ${isSuccess ? "is-success" : ""}`} role="status">{message}</div>}
        <Button type="submit" icon={ArrowRight} iconAfter className="button-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in to workspace"}
        </Button>
        <div className="auth-trust"><ShieldCheck size={15} /> Your data is private and secure</div>
      </form>
      <p className="auth-switch">New to SkillGap AI? <Link to="/register">Create an account</Link></p>
      <DemoFooter />
    </AuthLayout>
  );
}

export default Login;