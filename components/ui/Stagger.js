'use client';
import { Children } from 'react';
import { motion } from 'motion/react';
import { spring } from '@/lib/motion';

// Each direct child rises and fades in, 30ms after the one before. It plays once, when the screen opens.
// Only transform and opacity animate. With reduced motion the rise is skipped by MotionConfig.
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: spring.soft } };

export default function Stagger({ className, step = 0.03, children }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: step } } }}
    >
      {Children.toArray(children).map((child, i) => (
        <motion.div key={child.key ?? i} variants={ITEM}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
