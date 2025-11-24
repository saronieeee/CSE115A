// src/pages/SignUp.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Sign up failed");
      return;
    }
    navigate("/signin");
  };

  return (
    <div className="auth-container">
      {/* Main form */}
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start organizing your wardrobe today</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="auth-label">Password</label>
          <input
            type="password"
            className="auth-input"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <p className="auth-terms-text">
            By creating an account, you agree to our{" "}
            <a href="#" className="auth-terms-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="auth-terms-link">
              Privacy Policy
            </a>
            .
          </p>

          <button type="submit" className="auth-btn">
            Create Account →
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/signin" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
