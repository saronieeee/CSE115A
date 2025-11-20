// src/pages/SignIn.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignIn.css";
import { supabase } from "../lib/supabaseClient";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message || "Sign in failed");
      return;
    }
    const token = data.session?.access_token;
    if (token) {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        navigate("/wardrobe");
      } else {
        alert(json.error || "Failed to fetch user");
      }
    }
  };

  const handleForgot = async () => {
    if (!email) {
      alert("Enter your email above first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      alert(error.message || "Reset failed");
      return;
    }
    alert("Check your email for the password reset link");
  };

  return (
    <div className="signin-container">
      {/* Header / Top bar */}
      <div className="signin-header">
        <div className="logo-section">
          <img src="/logo.svg" alt="logo" className="logo" />
          <span className="logo-text">Dress to Impress</span>
        </div>
      </div>

      {/* Main form */}
      <div className="signin-card">
        <h1 className="title">Welcome back</h1>
        <p className="subtitle">Sign in to access your digital wardrobe</p>

        <form onSubmit={handleSubmit}>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-row">
            <label className="label">Password</label>
            <button type="button" className="forgot-btn" onClick={handleForgot}>
              Forgot password?
            </button>
          </div>

          <input
            type="password"
            className="input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="signin-btn">
            Sign In →
          </button>
        </form>

        <p className="footer-text">
          Don’t have an account?{" "}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
