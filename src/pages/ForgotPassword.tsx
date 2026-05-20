import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SentriXLogo from "@/components/SentriXLogo";
import { auth } from "@/services/api";  

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sending" | "sent">("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep("sending");
    try {
      await auth.forgotPassword(email);
      setStep("sent");
    } catch (err) {
      setStep("sent"); // Still show success for security
    }
};

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
        className="relative z-10 w-full max-w-sm space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-4">
          <SentriXLogo size={60} animate={false} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {step === "sent" ? "Check Your Email" : "Reset Password"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "sent"
                ? "We've sent a password reset link to your email"
                : "Enter your email to receive a reset link"}
            </p>
          </div>
        </div>

        {step !== "sent" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12 pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={step === "sending" || !email}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12"
            >
              {step === "sending" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        ) : (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="h-16 w-16 rounded-full bg-safe/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-safe" />
            </div>

            <div className="card-sentrix p-4 w-full">
              <p className="text-xs text-muted-foreground text-center">
                Sent to: <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Didn't receive it? Check your spam folder or{" "}
              <button
                onClick={() => setStep("email")}
                className="text-primary hover:underline"
              >
                try again
              </button>
            </p>
          </motion.div>
        )}

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
