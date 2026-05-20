import { motion } from "framer-motion";

interface SentriXLogoProps {
  size?: number;
  animate?: boolean;
}

const SentriXLogo = ({ size = 80, animate = true }: SentriXLogoProps) => {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={animate ? { scale: 0.8, opacity: 0 } : {}}
      animate={animate ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="absolute rounded-full glow-primary"
        style={{ width: size * 1.6, height: size * 1.6 }}
        animate={animate ? {
          boxShadow: [
            "0 0 20px hsla(147, 47%, 55%, 0.2), 0 0 60px hsla(147, 47%, 55%, 0.05)",
            "0 0 40px hsla(147, 47%, 55%, 0.4), 0 0 100px hsla(147, 47%, 55%, 0.15)",
            "0 0 20px hsla(147, 47%, 55%, 0.2), 0 0 60px hsla(147, 47%, 55%, 0.05)",
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M40 8L12 22V42C12 56.36 24.16 69.56 40 73C55.84 69.56 68 56.36 68 42V22L40 8Z"
          stroke="hsl(147, 47%, 55%)"
          strokeWidth="2.5"
          fill="hsla(147, 47%, 55%, 0.08)"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M40 20L22 28V40C22 50.4 30.4 60 40 62.5C49.6 60 58 50.4 58 40V28L40 20Z"
          stroke="hsl(190, 72%, 40%)"
          strokeWidth="1.5"
          fill="hsla(190, 72%, 40%, 0.06)"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.path
          d="M36 41L39 44L46 37"
          stroke="hsl(147, 47%, 55%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
};

export default SentriXLogo;

