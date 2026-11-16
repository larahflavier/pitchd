'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import SoundToggle from './SoundToggle';
import { readState, writeState } from '@/lib/storage';
import { setSoundEnabled } from '@/lib/sound';

// Top row of the About page: a back button and the same sound toggle every screen has.
export default function AboutHeader() {
  const router = useRouter();
  const [on, setOn] = useState(true);

  useEffect(() => {
    const s = readState();
    setOn(s.sound !== false);
    setSoundEnabled(s.sound !== false);
  }, []);

  const change = (sound) => {
    setOn(sound);
    writeState({ ...readState(), sound }); // same saved setting as the header toggle and Account
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <div className="mb-3 flex items-center justify-between">
      <button onClick={back} aria-label="Back" className="grid size-10 place-items-center rounded-full border border-line bg-surface">
        <ArrowLeft size={18} strokeWidth={2.25} />
      </button>
      <SoundToggle on={on} onChange={change} />
    </div>
  );
}
