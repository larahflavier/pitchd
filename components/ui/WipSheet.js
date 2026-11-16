'use client';
import { AnimatePresence, motion } from 'motion/react';
import Mascot from '../Mascot';
import { PRIMARY, SIZE } from './button-styles';
import { spring } from '@/lib/motion';

// A small "work in progress" popup for features that are not built yet.
// It slides up from the bottom and can be dragged down to dismiss. It never leaves the screen you are on,
// so an open draft stays safe underneath.
export default function WipSheet({ open, title = 'Work in progress', text, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[430px] rounded-t-[36px] bg-surface px-7 pt-3 text-center"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring.soft}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
            <div className="flex justify-center"><Mascot mood="neutral" pose="tinker" size={96} /></div>
            <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight">{title}</h2>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-muted-foreground">{text}</p>
            <button autoFocus className={`${PRIMARY} ${SIZE.md} mt-5 w-full`} onClick={onClose}>Got it</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
