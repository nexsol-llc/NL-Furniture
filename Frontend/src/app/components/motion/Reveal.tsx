"use client";

import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

function itemVariants(reduced: boolean, y: number): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.2 : 0.4, ease: EASE } },
  };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Vertical offset (px) the element slides up from. */
  y?: number;
  /** Extra delay in seconds, e.g. to sequence a heading before its body copy. */
  delay?: number;
};

/** Scroll-triggered fade/slide-up for a single standalone element (headings, section intros). */
export function Reveal({ children, className, y = 16, delay = 0 }: RevealProps) {
  const reduced = useReducedMotion();
  const variants = itemVariants(!!reduced, y);
  if (delay) variants.show = { ...variants.show, transition: { ...(variants.show as any).transition, delay } };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  /** Delay between each child's reveal, in seconds. */
  stagger?: number;
};

/** Stagger container — wrap a grid/list and use <RevealItem> for each child. */
export function RevealGroup({ children, className, stagger = 0.04 }: RevealGroupProps) {
  // Deliberately `useInView` + `animate` rather than `whileInView`: gesture
  // variants only propagate at the instant they fire, so items mounted later
  // (e.g. after an indoor/outdoor tab switch swaps the keys) would stay stuck
  // at `hidden`/opacity-0. A plain `animate` prop is inherited by children on
  // mount, so late arrivals reveal too. `once` keeps the one-shot behaviour.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
};

/** A single item inside a <RevealGroup> — inherits the parent's stagger timing. */
export function RevealItem({ children, className, y = 12 }: RevealItemProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} variants={itemVariants(!!reduced, y)}>
      {children}
    </motion.div>
  );
}
