import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Fingerprint, ScanFace, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SentriXLogo from "@/components/SentriXLogo";
import { auth } from "@/services/api";

const API_BASE = 'http://192.168.1.15:3000';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await auth.login(email, password);
      
      if (response.status === 'success' && response.data?.access_token) {
        if (rememberMe) {
          localStorage.setItem('sentrix_token', response.data.access_token);
          localStorage.setItem('sentrix_email', email);
        } else {
          sessionStorage.setItem('sentrix_token', response.data.access_token);
        }
        navigate("/dashboard");
      } else if (response.requires_2fa) {
        localStorage.setItem('sentrix_2fa_user_id', response.user_id);
        navigate("/two-factor");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Get challenge from backend
      const challengeRes = await fetch(`${API_BASE}/api/auth/webauthn/login-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const challengeData = await challengeRes.json();
      
      if (challengeData.status !== 'success') {
        throw new Error('Failed to get challenge');
      }

      // 2. Get credential from browser (triggers fingerprint/face prompt)
      const credential = await navigator.credentials.get({
        publicKey: challengeData.data
      });

      // 3. Verify with backend
      const response = await fetch(`${API_BASE}/api/auth/webauthn/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential)
      });

      const data = await response.json();
      if (data.status === 'success') {
        localStorage.setItem('sentrix_token', data.data.access_token);
        navigate("/dashboard");
      } else {
        setError("Biometric authentication failed.");
      }
    } catch (err: any) {
      setError("Biometric not available. Please use your password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/google";
  };

  const handleAppleLogin = () => {
    window.location.href = "http://localhost:3000/api/auth/apple";
  };

  // Load saved email on mount
  useState(() => {
    const savedEmail = localStorage.getItem('sentrix_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  });

  return (
    <div className="theme-dark flex min-h-screen flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsla(147,47%,55%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(147,47%,55%,0.1) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-4">
          <SentriXLogo size={60} animate={false} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your security dashboard
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <Input
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">Remember me</span>
            </label>
            <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12"
            disabled={loading}
          >
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Signing in..." : "Secure Login"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted-foreground">or continue with</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google + Apple */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-border bg-card hover:bg-muted h-12 justify-center gap-3"
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm text-foreground">Continue with Google</span>
          </Button>

          <Button
            variant="outline"
            className="w-full border-border bg-card hover:bg-muted h-12 justify-center gap-3"
            onClick={handleAppleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm text-foreground">Continue with Apple</span>
          </Button>
        </div>

        {/* Biometrics */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border bg-card hover:bg-muted h-12"
            onClick={handleBiometricLogin}
          >
            <Fingerprint className="mr-2 h-5 w-5 text-primary" />
            <span className="text-foreground text-sm">Fingerprint</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-border bg-card hover:bg-muted h-12"
            onClick={handleBiometricLogin}
          >
            <ScanFace className="mr-2 h-5 w-5 text-secondary" />
            <span className="text-foreground text-sm">Face ID</span>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <button onClick={() => navigate("/register")} className="text-primary hover:underline">Register Company</button>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Protected by end-to-end encryption
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
