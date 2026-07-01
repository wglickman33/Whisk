import { motion } from "framer-motion";

const iconTransition = { duration: 0.4, ease: "easeInOut" as const };

export function IconFolder({ className }: { className?: string }) {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.02 } },
        hover: { transition: { staggerChildren: 0.02 } },
      }}
    >
      <motion.path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
    </motion.svg>
  );
}

export function IconFile({ className }: { className?: string }) {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.03 } },
        hover: { transition: { staggerChildren: 0.03 } },
      }}
    >
      <motion.path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
      <motion.polyline
        points="14 2 14 8 20 8"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
      <motion.line
        x1="16"
        y1="13"
        x2="8"
        y2="13"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
      <motion.line
        x1="16"
        y1="17"
        x2="8"
        y2="17"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
      <motion.polyline
        points="10 9 9 9 8 9"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
    </motion.svg>
  );
}

export function IconWrench({ className }: { className?: string }) {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.02 } },
        hover: { transition: { staggerChildren: 0.02 } },
      }}
    >
      <motion.path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
          hover: { pathLength: 1, opacity: 1 },
        }}
        transition={iconTransition}
      />
    </motion.svg>
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={iconTransition}
    >
      <motion.path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={iconTransition}
      />
    </motion.svg>
  );
}

export function IconSun({ className }: { className?: string }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={iconTransition}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={iconTransition}
      />
      <motion.line
        x1="12"
        y1="1"
        x2="12"
        y2="3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.05 }}
      />
      <motion.line
        x1="12"
        y1="21"
        x2="12"
        y2="23"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.05 }}
      />
      <motion.line
        x1="4.22"
        y1="4.22"
        x2="5.64"
        y2="5.64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.1 }}
      />
      <motion.line
        x1="18.36"
        y1="18.36"
        x2="19.78"
        y2="19.78"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.1 }}
      />
      <motion.line
        x1="1"
        y1="12"
        x2="3"
        y2="12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.15 }}
      />
      <motion.line
        x1="21"
        y1="12"
        x2="23"
        y2="12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.15 }}
      />
      <motion.line
        x1="4.22"
        y1="19.78"
        x2="5.64"
        y2="18.36"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.2 }}
      />
      <motion.line
        x1="18.36"
        y1="5.64"
        x2="19.78"
        y2="4.22"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...iconTransition, delay: 0.2 }}
      />
    </motion.svg>
  );
}
