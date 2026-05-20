import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SentriXLogo from "@/components/SentriXLogo";

const SplashScreen = () => {
  const navigate = useNavigate();

   useEffect(() => {
    const token = localStorage.getItem('sentrix_token');
    if (token) {
      navigate("/dashboard");
    } else {
      const timer = setTimeout(() => {
        navigate("/environment-check");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  return (
    <div className="theme-dark flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background grid effect */}
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
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SentriXLogo size={100} />

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Sentri<span className="text-gradient">X</span>
          </h1>
          <motion.p
            className="mt-2 text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            Cyber Security Platform
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-8 flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
