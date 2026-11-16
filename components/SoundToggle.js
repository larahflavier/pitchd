'use client';
import { Volume2, VolumeX } from 'lucide-react';
import { play, setSoundEnabled } from '@/lib/sound';

// Speaker in the header of every screen. The choice is saved in the same setting as Account > Sound.
export default function SoundToggle({ on, onChange }) {
  const toggle = () => {
    const next = !on;
    setSoundEnabled(next);
    if (next) play('on'); // a short blip, so you can hear it works
    onChange(next);
  };
  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Sound on. Tap to mute.' : 'Sound off. Tap to turn on.'}
      aria-pressed={on}
      className="pointer-events-auto grid size-9 place-items-center rounded-full border border-line bg-surface text-ink active:scale-95"
    >
      {on ? <Volume2 size={17} strokeWidth={2.25} /> : <VolumeX size={17} strokeWidth={2.25} className="text-muted-foreground" />}
    </button>
  );
}
