import { motion } from "framer-motion";

const transition = { duration: 0.35, ease: "easeInOut" as const };

interface IconHamburgerProps {
  open: boolean;
  className?: string;
}

export function IconHamburger({ open, className }: IconHamburgerProps) {
  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <motion.g
        animate={{
          rotate: open ? 45 : 0,
          y: open ? 5 : 0,
        }}
        transition={transition}
        style={{ transformOrigin: "12px 7px" }}
      >
        <line x1="6" y1="7" x2="18" y2="7" />
      </motion.g>
      <motion.line
        x1="6"
        y1="12"
        x2="18"
        y2="12"
        animate={{ opacity: open ? 0 : 1 }}
        transition={transition}
      />
      <motion.g
        animate={{
          rotate: open ? -45 : 0,
          y: open ? -5 : 0,
        }}
        transition={transition}
        style={{ transformOrigin: "12px 17px" }}
      >
        <line x1="6" y1="17" x2="18" y2="17" />
      </motion.g>
    </motion.svg>
  );
}
