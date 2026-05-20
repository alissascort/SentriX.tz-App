import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Activity, AlertTriangle, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: Shield,
    title: "SentriX Platform",
    description:
      "The SentriX App connects IT officers and cybersecurity teams to the SentriX Security Platform for monitoring systems, managing incidents, and integrating company infrastructure.",
  },
  {
    icon: Activity,
    title: "Real-Time Threat Detection",
    description:
      "Monitor servers, devices and networks from one unified platform. Get instant visibility into your entire security posture.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Response",
    description:
      "Investigate and respond to threats directly from your mobile device. Take immediate action when security events occur.",
  },
  {
    icon: BarChart3,
    title: "Security Analytics",
    description:
      "Receive alerts for suspicious activity and attacks with consistent analysis, metrics, and actionable intelligence.",
  },
  {
    icon: Globe,
    title: "Enterprise Cyber Defense",
    description:
      "Connect your company systems to the SentriX security network. Centralized protection for your entire organization.",
  },
];

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const isLast = current === slides.length - 1;

  const goToLogin = () => navigate("/login");

  return (
   <div className="theme-dark flex min-h-screen flex-col bg-background px-6 py-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, hsla(147,47%,55%,0.08) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground text-sm"
          onClick={goToLogin}
        >
          Skip
        </Button>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
              {(() => {
                const Icon = slides[current].icon;
                return <Icon className="h-12 w-12 text-primary" />;
              })()}
            </div>

            <h2 className="mb-4 text-2xl font-bold text-foreground">
              {slides[current].title}
            </h2>

            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots and button */}
      <div className="relative z-10 flex flex-col items-center gap-8 pb-4">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={isLast ? goToLogin : () => setCurrent(current + 1)}
          className="w-full max-w-xs bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6"
        >
          {isLast ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
