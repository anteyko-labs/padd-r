'use client';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Яркий шар слева */}
      <motion.div
        className="absolute"
        style={{
          top: '-10vw',
          left: '-10vw',
          width: '80vw',
          height: '80vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #00ffb2 0%, #00e0ff 60%, #0077ff 100%, transparent 100%)',
          filter: 'blur(30px)',
          opacity: 0.5,
        }}
        animate={{
          x: [0, 60, 0, -60, 0],
          y: [0, 40, 0, -40, 0],
          scale: [1, 1.1, 1, 0.9, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Яркий шар справа */}
      <motion.div
        className="absolute"
        style={{
          bottom: '-10vw',
          right: '-10vw',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 70%, #ff00e0 0%, #ff0077 60%, #0077ff 100%, transparent 100%)',
          filter: 'blur(20px)',
          opacity: 0.4,
        }}
        animate={{
          x: [0, -40, 0, 40, 0],
          y: [0, -30, 0, 30, 0],
          scale: [1, 1.08, 1, 0.92, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
} 