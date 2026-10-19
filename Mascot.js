'use client';
import { useId } from 'react';

// Pip: an original, static mascot. Expressions are fixed poses swapped by state (no animation).
// mood: 'neutral' | 'happy' | 'oops'
export default function Mascot({ mood = 'neutral', size = 160, sparkles = false }) {
  const uid = useId().replace(/:/g, '');
  const ink = '#0b1b3a';
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" role="img" aria-label={`Pip the mascot looking ${mood}`}>
      <defs>
        <linearGradient id={`body${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fa8ff" />
          <stop offset="1" stopColor="#2f66d8" />
        </linearGradient>
      </defs>

      {sparkles && (
        <g fill="#fff" opacity=".9">
          <path d="M20 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
          <path d="M176 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          <path d="M168 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </g>
      )}

      {/* ground shadow */}
      <ellipse cx="100" cy="206" rx="52" ry="7" fill="#2f66d8" opacity=".18" />

      {/* arms */}
      {mood === 'happy' ? (
        <>
          <ellipse cx="30" cy="104" rx="11" ry="19" transform="rotate(-28 30 104)" fill="#4f8df2" />
          <ellipse cx="170" cy="104" rx="11" ry="19" transform="rotate(28 170 104)" fill="#4f8df2" />
        </>
      ) : (
        <>
          <ellipse cx="29" cy="146" rx="11" ry="19" transform="rotate(14 29 146)" fill="#4f8df2" />
          <ellipse cx="171" cy="146" rx="11" ry="19" transform="rotate(-14 171 146)" fill="#4f8df2" />
        </>
      )}

      {/* body */}
      <path
        d="M100 34C150 34 174 76 174 124C174 178 142 202 100 202C58 202 26 178 26 124C26 76 50 34 100 34Z"
        fill={`url(#body${uid})`}
      />
      <path d="M52 80C60 58 78 46 98 44" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".35" />

      {/* tuft */}
      <path d="M100 36C94 18 104 6 120 8C118 22 112 32 100 36Z" fill="#2f66d8" />
      <path d="M100 36C90 24 82 22 74 24C78 32 88 38 100 36Z" fill="#4f8df2" />

      {/* belly */}
      <ellipse cx="100" cy="158" rx="40" ry="34" fill="#fff" opacity=".18" />

      {/* cheeks */}
      <ellipse cx="55" cy="130" rx="11" ry="7" fill="#ff9db1" opacity=".55" />
      <ellipse cx="145" cy="130" rx="11" ry="7" fill="#ff9db1" opacity=".55" />

      {/* eyes */}
      {mood === 'happy' ? (
        <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round">
          <path d="M62 112Q76 92 90 112" />
          <path d="M110 112Q124 92 138 112" />
        </g>
      ) : (
        <g>
          <ellipse cx="76" cy="108" rx="16" ry="19" fill="#fff" />
          <ellipse cx="124" cy="108" rx="16" ry="19" fill="#fff" />
          <circle cx={mood === 'oops' ? 74 : 79} cy={mood === 'oops' ? 114 : 110} r="9" fill={ink} />
          <circle cx={mood === 'oops' ? 122 : 127} cy={mood === 'oops' ? 114 : 110} r="9" fill={ink} />
          <circle cx={mood === 'oops' ? 71 : 76} cy={mood === 'oops' ? 110 : 106} r="3.2" fill="#fff" />
          <circle cx={mood === 'oops' ? 119 : 124} cy={mood === 'oops' ? 110 : 106} r="3.2" fill="#fff" />
        </g>
      )}

      {/* brows for oops */}
      {mood === 'oops' && (
        <g fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round">
          <path d="M62 90L90 82" />
          <path d="M138 90L110 82" />
        </g>
      )}

      {/* mouth */}
      {mood === 'happy' && (
        <>
          <path d="M80 134Q100 164 120 134Z" fill={ink} />
          <path d="M91 148Q100 156 109 148Q100 143 91 148Z" fill="#ff7f96" />
        </>
      )}
      {mood === 'neutral' && <path d="M88 138Q100 149 112 138" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />}
      {mood === 'oops' && <path d="M90 148Q100 139 110 148" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />}

      {/* tie */}
      <path d="M92 168L108 168L104 178L96 178Z" fill="#0b1b3a" />
      <path d="M96 178L104 178L109 198L100 204L91 198Z" fill="#0b1b3a" />
      <path d="M96 186L104 186" stroke="#7fb0ff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
