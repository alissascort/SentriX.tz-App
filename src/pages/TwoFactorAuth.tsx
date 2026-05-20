import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SentriXLogo from "@/components/SentriXLogo";

const API_BASE = 'http://192.168.1.15:3000';
const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 300;

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [step, setStep] = useState<"input" | "verifying" | "success" | "failed">("input");
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "input") return;
    if (countdown <= 0) {
      setStep("failed");
      setErrorMsg("Verification code expired. Please login again to get a new code.");
      return;
    }
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    const timer = setTimeout(() => setCanResend(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "") && newOtp.join("").length === OTP_LENGTH) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();
    if (newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleVerify = async (code: string) => {
    setStep("verifying");
    setErrorMsg("");

    try {
      const userId = localStorage.getItem('sentrix_2fa_user_id');
      const response = await fetch(`${API_BASE}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId || '0'), code })
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Save token and navigate
        localStorage.setItem('sentrix_token', data.data.access_token);
        localStorage.removeItem('sentrix_2fa_user_id');
        setStep("success");
      } else {
        setAttemptsLeft(data.attempts_remaining || 0);
        setErrorMsg(data.message || "Invalid code. Please try again.");
        setStep("failed");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      setStep("failed");
    }
  };

  const handleResend = async () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(COUNTDOWN_SECONDS);
    setStep("input");
    setCanResend(false);
    setErrorMsg("");
    setAttemptsLeft(3);
    inputRefs.current[0]?.focus();
    setTimeout(() => setCanResend(true), 30000);

    // Request new code from backend
    try {
      const email = localStorage.getItem('sentrix_email');
      const password = prompt("Enter your password to resend the code:");
      if (!password) return;

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.requires_2fa) {
        localStorage.setItem('sentrix_2fa_user_id', data.user_id);
      }
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  const handleRetry = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(COUNTDOWN_SECONDS);
    setStep("input");
    setErrorMsg("");
    inputRefs.current[0]?.focus();
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('sentrix_2fa_user_id');
    navigate("/login");
  };

  return (
    <div className="theme-dark flex min-h-screen flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(hsla(147,47%,55%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(147,47%,55%,0.1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      </div>

      <motion.div className="relative z-10 w-full max-w-sm space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col items-center gap-4">
          <SentriXLogo size={60} animate={false} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {step === "success" ? "Verified!" : step === "failed" ? "Verification Failed" : "Two-Factor Authentication"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "success" ? "Your identity has been confirmed" : step === "failed" ? errorMsg || "Invalid code. Please try again." : "Enter the 6-digit code sent to your email"}
            </p>
            {attemptsLeft < 3 && step === "failed" && (
              <p className="text-xs text-destructive mt-1">{attemptsLeft} attempts remaining</p>
            )}
          </div>
        </div>

        {/* OTP Input */}
        {step === "input" && (
          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg bg-card border-2 border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>

            <div className="card-sentrix p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Code expires in</span>
                <span className={`text-lg font-mono font-bold ${countdown < 60 ? "text-destructive" : "text-primary"}`}>{formatTime(countdown)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2 overflow-hidden">
                <motion.div className={`h-full rounded-full ${countdown < 60 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }} />
              </div>
              {countdown < 60 && <p className="text-[10px] text-destructive mt-1">Code will expire soon</p>}
            </div>

            <div className="text-center">
              {canResend ? (
                <button onClick={handleResend} className="text-xs text-primary hover:underline">Resend Code</button>
              ) : (
                <p className="text-xs text-muted-foreground">You can resend the code in 30 seconds</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Verifying */}
        {step === "verifying" && (
          <motion.div className="flex flex-col items-center py-8 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying code...</p>
          </motion.div>
        )}

        {/* Success */}
        {step === "success" && (
          <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-safe/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-safe" />
              </div>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
              <ShieldCheck className="mr-2 h-4 w-4" /> Continue to Dashboard
            </Button>
          </motion.div>
        )}

        {/* Failed */}
        {step === "failed" && (
          <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Button onClick={handleResend} variant="outline" className="w-full border-border h-12">Resend Code</Button>
            </div>
          </motion.div>
        )}

        {step === "input" && (
          <button onClick={handleBackToLogin} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default TwoFactorAuth;
