'use client';
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { Wrench } from 'lucide-react';
import Sticker from './ui/Sticker';
import { spring } from '@/lib/motion';
import { usePipReaction } from '@/lib/pip';

// Pip: an original mascot with flat fills in the logo palette.
//   mood: 'neutral' | 'happy' | 'oops'  (the face)
//   pose: what Pip is doing, see POSES below  (the movement)
//   reactive: also respond to usePip().react(...) from anywhere in the app
// Only transform and opacity animate. With reduced motion Pip holds still.
// Pose names: idle, peek, wave, think, hype, combo, oops, celebrate, sleepy, point, tinker.

const ORIGIN = (o) => ({ transformBox: 'fill-box', transformOrigin: o });
const REACTION_POSE = { correct: 'hype', combo: 'combo', combo5: 'combo5', wrong: 'oops', complete: 'celebrate' };
const STAR = 'M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z';
// where the combo stars fly to, from the middle of the head
const STAR_SPOTS = [[-70, -40], [70, -44], [-86, 6], [88, 4], [-44, -70], [46, -72], [0, -84], [-30, 60], [32, 62]];

export default function Mascot({ mood = 'neutral', pose = 'idle', size = 160, sparkles = false, reactive = false, pointAngle = -100 }) {
  const reduced = useReducedMotion();
  const reaction = usePipReaction(reactive);
  const [auto, setAuto] = useState(null); // where a one-shot pose settles (wave, hype, oops...)
  useEffect(() => { setAuto(null); }, [pose]);

  const reactPose = reaction ? REACTION_POSE[reaction.type] || 'hype' : null;
  const effPose = reactPose || auto || pose;
  const effMood = reaction ? (reaction.type === 'wrong' ? 'oops' : 'happy') : mood;

  const root = useRef(null);
  const armL = useRef(null);
  const armR = useRef(null);
  const body = useRef(null);
  const tuft = useRef(null);
  const eyes = useRef(null);
  const pupils = useRef(null);
  const mouthOpen = useRef(null);
  const stars = useRef([]);

  // ----- poses -----
  useEffect(() => {
    const all = [root, armL, armR, body, tuft, eyes, pupils, mouthOpen];
    all.forEach((r) => { if (r.current) r.current.style.transform = ''; });
    stars.current.forEach((el) => { if (el) { el.style.transform = ''; el.style.opacity = 0; } });
    if (mouthOpen.current) mouthOpen.current.style.transform = 'scaleY(0)';
    if (reduced) return;

    const stops = [];
    const timers = [];
    const go = (ref, kf, opts) => { if (ref.current) stops.push(animate(ref.current, kf, opts)); };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const settle = (ms) => { if (!reactPose) later(() => setAuto('idle'), ms); };
    const calm = (period = 3) => {
      go(body, { scale: [1, 1.03, 1] }, { duration: period, repeat: Infinity, ease: 'easeInOut' });
      go(tuft, { rotate: [-3, 3, -3] }, { duration: period + 1, repeat: Infinity, ease: 'easeInOut' });
    };
    const burst = (n) => {
      stars.current.slice(0, n).forEach((el, i) => {
        if (!el) return;
        const [x, y] = STAR_SPOTS[i];
        stops.push(animate(el, { x: [0, x], y: [0, y], scale: [0.3, 1.1], opacity: [1, 0] }, { duration: 0.55, ease: 'easeOut' }));
      });
    };

    switch (effPose) {
      case 'peek': {
        // slides up from the edge, eyes first, then the body, then waves
        if (root.current) root.current.style.transform = 'translateY(90px)';
        go(root, { y: 38 }, { duration: 0.4, ease: 'easeOut' });
        later(() => go(root, { y: 0 }, { ...spring.soft }), 650);
        later(() => setAuto('wave'), 1250);
        break;
      }
      case 'wave':
        go(armR, { rotate: [0, -110, -75, -110, -75, -110, -75, 0] }, { duration: 0.9, ease: 'easeInOut' });
        go(root, { rotate: [0, 4, 4, 0] }, { duration: 0.9, ease: 'easeInOut' });
        settle(950);
        break;
      case 'think':
        go(root, { rotate: 6 }, { ...spring.soft });
        go(pupils, { x: -3, y: -4 }, { ...spring.soft });
        calm(4);
        break;
      case 'hype':
        go(root, { y: [0, -14, 0, 0], scaleY: [1, 1.03, 0.92, 1] }, { duration: 0.45, times: [0, 0.4, 0.8, 1], ease: 'easeOut' });
        go(armL, { rotate: [0, 140, 140, 0] }, { duration: 0.45, times: [0, 0.3, 0.75, 1] });
        go(armR, { rotate: [0, -140, -140, 0] }, { duration: 0.45, times: [0, 0.3, 0.75, 1] });
        settle(500);
        break;
      case 'combo':
      case 'combo5': {
        const big = effPose === 'combo5';
        go(root, big
          ? { y: [0, -24, 0, 0], scaleY: [1, 1.04, 0.9, 1], rotate: [0, 180, 360, 360] }
          : { y: [0, -22, 0, 0], scaleY: [1, 1.04, 0.9, 1] },
        { duration: big ? 0.65 : 0.5, times: [0, 0.45, 0.85, 1], ease: 'easeOut' });
        go(armL, { rotate: [0, 150, 150, 0] }, { duration: 0.5, times: [0, 0.3, 0.75, 1] });
        go(armR, { rotate: [0, -150, -150, 0] }, { duration: 0.5, times: [0, 0.3, 0.75, 1] });
        burst(big ? 9 : 5);
        settle(big ? 700 : 600);
        break;
      }
      case 'oops':
        go(root, { scaleY: [1, 0.94, 0.94, 1], rotate: [0, -4, 4, -2, 0] }, { duration: 0.6, ease: 'easeInOut' });
        go(pupils, { x: [0, 2, 2, 0], y: [0, 3, 3, 0] }, { duration: 0.6 });
        settle(600);
        break;
      case 'celebrate':
        go(root, { x: [-6, 6], rotate: [-4, 4] }, { duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });
        go(armL, { rotate: [130, 40] }, { duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });
        go(armR, { rotate: [-40, -130] }, { duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });
        break;
      case 'sleepy':
        go(eyes, { scaleY: 0.45 }, { duration: 0.6 });
        go(mouthOpen, { scaleY: [0, 1, 1, 0] }, { duration: 2.8, times: [0, 0.3, 0.7, 1], repeat: Infinity });
        calm(4.5);
        break;
      case 'point': {
        go(armR, { rotate: pointAngle }, { ...spring.snappy });
        timers.push(setInterval(() => {
          go(armR, { rotate: [pointAngle, pointAngle + 12, pointAngle] }, { duration: 0.5, ease: 'easeInOut' });
          go(root, { x: [0, 3, 0] }, { duration: 0.5, ease: 'easeInOut' });
        }, 8000));
        calm(3);
        break;
      }
      case 'tinker':
        go(root, { rotate: [-4, 4] }, { duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });
        go(pupils, { y: -4 }, { ...spring.soft });
        calm(3);
        break;
      default: // idle
        calm(3);
    }
    return () => { stops.forEach((s) => s.stop()); timers.forEach(clearTimeout); };
  }, [effPose, reduced, reaction?.id, pointAngle]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- blink every 3 to 5 seconds -----
  useEffect(() => {
    if (reduced || effMood === 'happy' || effPose === 'sleepy') return;
    let t;
    const loop = () => {
      t = setTimeout(() => {
        if (document.visibilityState === 'visible' && eyes.current) animate(eyes.current, { scaleY: [1, 0.1, 1] }, { duration: 0.14 });
        loop();
      }, 3000 + Math.random() * 2000);
    };
    loop();
    return () => clearTimeout(t);
  }, [reduced, effMood, effPose]);

  const looking = effMood === 'oops';
  const startsHidden = effPose === 'peek' && !reduced;

  return (
    <span className="relative inline-block align-top leading-[0]">
      <svg width={size} height={size * 1.1} viewBox="0 0 200 220" role="img" aria-label={`Pip the mascot looking ${effMood}`} style={{ overflow: 'visible' }}>
        {sparkles && (
          <g className="fill-white" opacity=".9">
            <path d="M20 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
            <path d="M176 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
            <path d="M168 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          </g>
        )}

        <g ref={root} style={{ ...ORIGIN('50% 100%'), transform: startsHidden ? 'translateY(90px)' : undefined }}>
          {/* arms */}
          {effMood === 'happy' ? (
            <>
              <g ref={armL} style={ORIGIN('50% 10%')}><ellipse cx="30" cy="104" rx="11" ry="19" transform="rotate(-28 30 104)" className="fill-royal" /></g>
              <g ref={armR} style={ORIGIN('50% 10%')}><ellipse cx="170" cy="104" rx="11" ry="19" transform="rotate(28 170 104)" className="fill-royal" /></g>
            </>
          ) : (
            <>
              <g ref={armL} style={ORIGIN('50% 10%')}><ellipse cx="29" cy="146" rx="11" ry="19" transform="rotate(14 29 146)" className="fill-royal" /></g>
              <g ref={armR} style={ORIGIN('50% 10%')}><ellipse cx="171" cy="146" rx="11" ry="19" transform="rotate(-14 171 146)" className="fill-royal" /></g>
            </>
          )}

          {/* body, belly, cheeks */}
          <g ref={body} style={ORIGIN('50% 100%')}>
            <path d="M100 34C150 34 174 76 174 124C174 178 142 202 100 202C58 202 26 178 26 124C26 76 50 34 100 34Z" className="fill-azure" />
            <ellipse cx="100" cy="158" rx="40" ry="34" className="fill-white" opacity=".2" />
            <ellipse cx="55" cy="130" rx="11" ry="7" className="fill-cyan-soft" />
            <ellipse cx="145" cy="130" rx="11" ry="7" className="fill-cyan-soft" />
          </g>

          {/* tuft */}
          <g ref={tuft} style={ORIGIN('60% 100%')}>
            <path d="M100 36C94 18 104 6 120 8C118 22 112 32 100 36Z" className="fill-royal" />
            <path d="M100 36C90 24 82 22 74 24C78 32 88 38 100 36Z" className="fill-royal" />
          </g>

          {/* eyes */}
          {effMood === 'happy' ? (
            <g fill="none" className="stroke-ink" strokeWidth="6" strokeLinecap="round">
              <path d="M62 112Q76 92 90 112" />
              <path d="M110 112Q124 92 138 112" />
            </g>
          ) : (
            <g ref={eyes} style={ORIGIN('50% 50%')}>
              <ellipse cx="76" cy="108" rx="16" ry="19" className="fill-white" />
              <ellipse cx="124" cy="108" rx="16" ry="19" className="fill-white" />
              <g ref={pupils}>
                <circle cx={looking ? 74 : 79} cy={looking ? 114 : 110} r="9" className="fill-ink" />
                <circle cx={looking ? 122 : 127} cy={looking ? 114 : 110} r="9" className="fill-ink" />
                <circle cx={looking ? 71 : 76} cy={looking ? 110 : 106} r="3.2" className="fill-white" />
                <circle cx={looking ? 119 : 124} cy={looking ? 110 : 106} r="3.2" className="fill-white" />
              </g>
            </g>
          )}

          {/* brows for oops */}
          {effMood === 'oops' && (
            <g fill="none" className="stroke-ink" strokeWidth="5" strokeLinecap="round">
              <path d="M62 90L90 82" />
              <path d="M138 90L110 82" />
            </g>
          )}

          {/* mouth */}
          {effMood === 'happy' && (
            <>
              <path d="M80 134Q100 164 120 134Z" className="fill-ink" />
              <path d="M91 148Q100 156 109 148Q100 143 91 148Z" className="fill-red-soft" />
            </>
          )}
          {effMood === 'neutral' && <path d="M88 138Q100 149 112 138" fill="none" className="stroke-ink" strokeWidth="5" strokeLinecap="round" />}
          {effMood === 'oops' && <path d="M90 148Q100 139 110 148" fill="none" className="stroke-ink" strokeWidth="5" strokeLinecap="round" />}
          {/* the sleepy yawn reuses the open mouth shape */}
          <g ref={mouthOpen} style={{ ...ORIGIN('50% 0%'), transform: 'scaleY(0)' }}>
            <path d="M80 134Q100 164 120 134Z" className="fill-ink" />
          </g>

          {/* tie */}
          <path d="M92 168L108 168L104 178L96 178Z" className="fill-royal" />
          <path d="M96 178L104 178L109 198L100 204L91 198Z" className="fill-royal" />
          <path d="M96 186L104 186" className="stroke-azure-soft" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* combo stars: flat cyan shapes with the royal outline, hidden until a combo */}
        <g transform="translate(100 62)">
          {STAR_SPOTS.map((_, i) => (
            <g key={i} ref={(el) => { stars.current[i] = el; }} style={{ ...ORIGIN('50% 50%'), opacity: 0 }}>
              <path d={STAR} className="fill-cyan stroke-royal" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </g>
      </svg>

      {effPose === 'sleepy' && (
        <motion.span
          className="pointer-events-none absolute -right-3 -top-3 leading-none"
          animate={reduced ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sticker variant="bubble" fill="white" rotate={8}>zz</Sticker>
        </motion.span>
      )}
      {effPose === 'tinker' && (
        <motion.span
          className="pointer-events-none absolute -right-5 top-6 grid size-9 place-items-center rounded-full border-2 border-royal bg-surface text-royal"
          animate={reduced ? undefined : { y: [0, -5, 0], rotate: [-12, 12, -12] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Wrench size={17} strokeWidth={2.25} />
        </motion.span>
      )}
    </span>
  );
}
