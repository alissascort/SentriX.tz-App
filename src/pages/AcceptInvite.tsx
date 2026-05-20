import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Shield, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SentriXLogo from "@/components/SentriXLogo";

const API_BASE = 'http://192.168.1.15:3000';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setValidToken(false);
      setValidating(false);
      return;
    }
    setValidToken(true);
    setValidating(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/users/accept-invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Failed to accept invitation.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Invalid Invitation</h2>
          <p className="text-sm text-muted-foreground">This invitation link is invalid or has expired.</p>
          <Button onClick={() => navigate("/login")} className="bg-accent hover:bg-accent/90">Go to Login</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle className="h-16 w-16 text-safe mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Account Activated!</h2>
          <p className="text-sm text-muted-foreground">Your password has been set. Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 relative overflow-hidden theme-dark">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(hsla(147,47%,55%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(147,47%,55%,0.1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      </div>

      <motion.div className="relative z-10 w-full max-w-sm space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center gap-4">
          <SentriXLogo size={60} animate={false} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Accept Invitation</h1>
            <p className="text-sm text-muted-foreground mt-1">Create your password to activate your account</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-card border-border text-foreground h-12 pr-12"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="bg-card border-border text-foreground h-12"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12" disabled={loading}>
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AcceptInvite;
