"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
  type SpringOptions,
} from "motion/react";

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  style?: MotionStyle;
  /** Max rotation in degrees. Kept subtle (8-10) so it reads as depth, not a gimmick. */
  rotationFactor?: number;
  reverse?: boolean;
  springOptions?: SpringOptions;
};

const DEFAULT_SPRING: SpringOptions = { stiffness: 300, damping: 30, mass: 0.5 };

/**
 * Mouse-follow 3D tilt. Only active on fine-pointer/hover-capable devices —
 * touch has no mousemove, so this would otherwise just sit permanently flat
 * on mobile while still paying for the transform/perspective on every frame.
 */
export function Tilt({
  children,
  className,
  style,
  rotationFactor = 8,
  reverse = false,
  springOptions = DEFAULT_SPRING,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    reverse ? [rotationFactor, -rotationFactor] : [-rotationFactor, rotationFactor]
  );
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    reverse ? [-rotationFactor, rotationFactor] : [rotationFactor, -rotationFactor]
  );

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        ...style,
        transform: enabled ? transform : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
