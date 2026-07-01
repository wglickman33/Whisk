import { motion } from "framer-motion";

const drawTransition = { duration: 0.35, ease: "easeInOut" as const };

export function IconFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconUnit() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 6h20v12H2z" />
      <path d="M4 10h2" />
      <path d="M4 14h2" />
      <path d="M8 10h2" />
      <path d="M8 14h2" />
      <path d="M12 10h2" />
      <path d="M12 14h2" />
      <path d="M16 10h2" />
      <path d="M16 14h2" />
    </svg>
  );
}

export function IconUpload() {
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
      aria-hidden
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.04 },
        },
      }}
    >
      <motion.path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
      <motion.polyline
        points="17 8 12 3 7 8"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
      <motion.line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
    </motion.svg>
  );
}

export function IconArrow() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={drawTransition}
    >
      <motion.line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={drawTransition}
      />
      <motion.polyline
        points="12 5 19 12 12 19"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...drawTransition, delay: 0.08 }}
      />
    </motion.svg>
  );
}

export function IconDownload() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.04 },
        },
      }}
    >
      <motion.path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
      <motion.polyline
        points="7 10 12 15 17 10"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
      <motion.line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
        variants={{
          hidden: { pathLength: 0, opacity: 0.5 },
          visible: { pathLength: 1, opacity: 1 },
        }}
        transition={drawTransition}
      />
    </motion.svg>
  );
}
