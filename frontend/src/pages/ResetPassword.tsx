import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(error.message || "Failed to update password");
      return;
    }
    navigate("/signin");
  };

  return (
    <div className="signin-container">
      <div className="signin-header">
        <Link to="/" className="back-link">← Back</Link>
        <div className="logo-section">
          <span className="logo-text">Dress to Impress</span>
        </div>
      </div>

      <div className="signin-card">
        <h1 className="title">Reset your password</h1>
        <p className="subtitle">Enter a new password for your account</p>

        <form onSubmit={handleSubmit}>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="label">Confirm Password</label>
          <input
            type="password"
            className="input"
            placeholder="Re-enter new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit" className="signin-btn">
            Update Password →
          </button>
        </form>
      </div>
    </div>
  );
}
