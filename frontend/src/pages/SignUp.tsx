// src/pages/SignUp.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Sign up failed");
      return;
    }
    navigate("/signin");
  };

  return (
    <div className="signup-container">
      {/* Header / Top bar */}
      <div className="signup-header">
        <div className="logo-section">
          <img src="/logo.svg" alt="logo" className="logo" />
          <span className="logo-text">Dress to Impress</span>
        </div>
      </div>

      {/* Main form */}
      <div className="signup-card">
        <h1 className="title">Create your account</h1>
        <p className="subtitle">Start organizing your wardrobe today</p>

        <form onSubmit={handleSubmit}>
          <label className="label">Full Name</label>
          <input
            type="text"
            className="input"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <p className="terms-text">
            By creating an account, you agree to our{" "}
            <a href="#" className="terms-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="terms-link">
              Privacy Policy
            </a>
            .
          </p>

          <button type="submit" className="signup-btn">
            Create Account →
          </button>
        </form>

        <p className="footer-text">
          Already have an account?{" "}
          <Link to="/signin" className="signin-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
