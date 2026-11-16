'use client';
import { useState } from 'react';
import Link from 'next/link';
import Mascot from './Mascot';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

const PILL = `${PRIMARY} ${SIZE.lg} w-full`;

export default function Landing({ onStart }) {
  const [note, setNote] = useState(false);
  return (
    <div className="main flex flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 rounded-[40px] bg-periwinkle px-10 pb-4 pt-8">
          <Mascot mood="happy" size={150} sparkles />
        </div>
        <h1 className="text-[30px] font-bold leading-tight tracking-tight">Pitchd</h1>
        <p className="mt-2 max-w-[18rem] text-[17px] font-semibold leading-snug">
          3 minutes a day to walk into interviews ready
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 pb-2">
        <button className={PILL} onClick={onStart}>Get started</button>
        <button className="text-[15px] font-semibold text-royal" onClick={() => setNote(true)}>
          I already have an account
        </button>
        {note && (
          <p className="text-center text-sm font-medium text-muted-foreground">
            Accounts are coming soon. For now your progress is saved on this device.
          </p>
        )}
        <Link href="/about" className="text-sm font-semibold text-muted-foreground underline underline-offset-4">
          Why it works
        </Link>
      </div>
    </div>
  );
}
