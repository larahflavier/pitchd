'use client';
import { useEffect, useRef } from 'react';
import { ChevronLeft, Check, Wrench, UserRound, CreditCard, Sparkles, Trophy, Shirt, PencilRuler } from 'lucide-react';
import Mascot from './Mascot';
import Stagger from './ui/Stagger';
import Sticker from './ui/Sticker';
import SoundToggle from './SoundToggle';
import { SECONDARY, SIZE } from './ui/button-styles';
import { cn } from '@/lib/utils';
import ROADMAP from '@/data/roadmap.json';

const ICONS = { UserRound, CreditCard, Sparkles, Trophy, Shirt, PencilRuler };
// Status chips: Not built yet is grey, In progress is soft azure, Live is soft cyan.
const CHIP = { 'not-built': 'bg-line text-ink', 'in-progress': 'bg-azure-soft text-royal', live: 'bg-cyan-soft text-royal' };
const TONES = ['bg-azure-soft', 'bg-cyan-soft'];

// An honest list of what isn't built yet, so the app doesn't look broken where a feature is missing.
// No price, no form, no email box: nothing here pretends to work. "I want this" only saves a tap on this device.
export default function WorkInProgress({ interest = {}, onInterest, onBack, focus, soundOn, onSound }) {
  const focusRef = useRef(null);
  useEffect(() => {
    // arriving from a lock or a button: bring that item into view
    if (focus && focusRef.current) focusRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [focus]);

  return (
    <div className="flex flex-1 flex-col">
      {/* royal header, full width */}
      <div
        className="relative -mx-[18px] overflow-hidden rounded-b-[28px] bg-royal px-[18px] pb-7 text-white"
        style={{ marginTop: 'calc(-1 * (env(safe-area-inset-top) + 18px))', paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <div className="flex items-center justify-between">
          <button onClick={onBack} aria-label="Back" className="grid size-11 place-items-center rounded-full bg-white/15 text-white">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <SoundToggle on={soundOn} onChange={onSound} />
        </div>

        <div className="relative mt-2 flex justify-center">
          <Mascot mood="neutral" pose="tinker" size={170} onDark tool={false} />
          <span className="pointer-events-none absolute right-[14%] top-2"><Sticker fill="cyan" rotate={11} points={10} size={78}><Wrench size={28} strokeWidth={2.5} aria-hidden="true" /></Sticker></span>
        </div>

        <h1 className="mt-4 text-[34px] font-bold leading-[1.04] tracking-tight">This is a work in progress!</h1>
        <p className="mt-2 text-[15px] font-medium text-white/90">
          We're a student team building this in public. Here's what isn't built yet, and why.
        </p>
      </div>

      <Stagger className="mt-5 flex flex-col gap-3">
        {ROADMAP.items.map((item, i) => {
          const Icon = ICONS[item.icon] || Wrench;
          const noted = !!interest[item.id];
          const focused = focus === item.id;
          return (
            <section
              key={item.id}
              ref={focused ? focusRef : undefined}
              className={cn('rounded-[28px] p-5', TONES[i % TONES.length], focused && 'ring-2 ring-royal ring-offset-2 ring-offset-app')}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-royal"><Icon size={22} strokeWidth={2} /></span>
                <span className={cn('rounded-full px-3 py-1 text-[12px] font-bold', CHIP[item.status] || CHIP['not-built'])}>
                  {ROADMAP.statuses[item.status] || ROADMAP.statuses['not-built']}
                </span>
              </div>
              <h2 className="mt-3 text-[20px] font-bold leading-tight tracking-tight text-royal">{item.name}</h2>
              <p className="mt-1 text-[15px] font-medium leading-snug">{item.does}</p>
              <p className="mt-2 text-[13px] font-medium leading-snug text-ink/75">
                <b className="font-bold">Why later:</b> {item.why}
              </p>
              {noted ? (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan px-4 py-2.5 text-[14px] font-bold text-royal">
                  <Check size={16} strokeWidth={3} />Noted
                </span>
              ) : (
                <button className={`${SECONDARY} ${SIZE.sm} mt-4`} onClick={() => onInterest(item.id)}>I want this</button>
              )}
            </section>
          );
        })}
        <p className="text-center text-[13px] font-medium text-muted-foreground">Saved on this device.</p>
      </Stagger>

      <p className="mb-2 mt-3 text-center text-[14px] font-semibold text-royal">
        Check back later. We'll keep adding to this list as we build.
      </p>
    </div>
  );
}
