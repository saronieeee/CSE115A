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

    // 1. Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message || "Sign in failed");
      return;
    }

    // 2. Grab session + token
    const token = data.session?.access_token;
    const userId = data.user?.id ?? data.session?.user?.id;

    if (!token) {
      alert("No access token returned from Supabase");
      return;
    }

    // 3. Store token + user id for use in the rest of the app
    //    - DTI_ACCESS_TOKEN: used for Authorization: Bearer <token>
    //    - DTI_DEV_USER_ID: keeps older dev code working that still reads this
    localStorage.setItem("DTI_ACCESS_TOKEN", token);
    if (userId) {
      localStorage.setItem("DTI_DEV_USER_ID", userId);
    }

    // 4. Ask backend who this user is via /api/auth/me
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // safe to include; backend uses Authorization
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to fetch user");
        return;
      }

      // 5. If backend confirms, navigate to wardrobe
      navigate("/wardrobe");
    } catch (err) {
      console.error("Failed to call /api/auth/me", err);
      alert("Something went wrong while verifying your session.");
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
        <Link to="/" className="back-link">
          ← Back
        </Link>
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

        <div className="divider">
          <span>Or continue with</span>
        </div>

        <div className="oauth-buttons">
          <button className="oauth-btn">
            <img src="/google.svg" alt="Google" className="oauth-icon" />
            Google
          </button>
          <button className="oauth-btn">
            <img src="/github.svg" alt="GitHub" className="oauth-icon" />
            GitHub
          </button>
        </div>

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
