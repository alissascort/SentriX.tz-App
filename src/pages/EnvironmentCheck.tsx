import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Wifi, Server, CheckCircle2, Loader2 } from "lucide-react";
import SentriXLogo from "@/components/SentriXLogo";

const checks = [
  { icon: Shield, text: "Checking system security...", duration: 1200 },
  { icon: Wifi, text: "Scanning devices...", duration: 1000 },
  { icon: Server, text: "Loading monitoring engine...", duration: 1400 },
];

const EnvironmentCheck = () => {
  const navigate = useNavigate();
  const [currentCheck, setCurrentCheck] = useState(0);
  const [completedChecks, setCompletedChecks] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentCheck >= checks.length) {
      const token = localStorage.getItem('sentrix_token');
      const timer = setTimeout(() => navigate(token ? "/dashboard" : "/onboarding"), 600);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCompletedChecks((prev) => [...prev, currentCheck]);
      setCurrentCheck((prev) => prev + 1);
    }, checks[currentCheck].duration);

    return () => clearTimeout(timer);
  }, [currentCheck, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const target = ((completedChecks.length + (currentCheck < checks.length ? 0.5 : 0)) / checks.length) * 100;
        if (prev >= target) return target;
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [completedChecks, currentCheck]);

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
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <SentriXLogo size={60} />

        <div className="w-full space-y-4">
          <AnimatePresence>
            {checks.map((check, index) => {
              const isCompleted = completedChecks.includes(index);
              const isActive = currentCheck === index;
              const Icon = check.icon;

              return (
                <motion.div
                  key={index}
                  className={`card-sentrix flex items-center gap-4 p-4 transition-all ${
                    isActive ? "border-primary/30" : ""
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.3, duration: 0.4 }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isCompleted ? "bg-safe/20" : isActive ? "bg-primary/20" : "bg-muted/30"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-safe" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isCompleted ? "text-safe" : isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {isCompleted ? check.text.replace("...", " ✓") : check.text}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Initializing security protocols...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EnvironmentCheck;
