'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ChevronRight, Download, Trash2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACKS, statsText, todayStr } from '@/lib/engine';
import { play, vibrate, setSoundEnabled, setHapticsEnabled, canVibrate } from '@/lib/sound';
import { SCHOOLS, YEARS, GOALS, INDUSTRIES, TIMELINES, MINUTES } from '@/lib/profile';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

const FIELD = 'w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-[15px] font-semibold outline-none focus:border-ink';
const PREMIUM_TAG = (
  <span className="inline-flex items-center gap-1 rounded-full bg-azure-soft px-2 py-0.5 text-[11px] font-bold text-royal">
    <Lock size={11} strokeWidth={2.5} />Premium
  </span>
);

function Section({ title, children, hint }) {
  return (
    <section className="rounded-[28px] bg-surface p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{hint}</p>}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Label({ children }) {
  return <span className="mb-1.5 block text-[13px] font-bold text-muted-foreground">{children}</span>;
}

function Chip({ on, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={cn('inline-flex min-h-11 items-center rounded-full border-2 px-3.5 text-[13px] font-semibold', on ? 'border-royal bg-azure-soft' : 'border-line')}>
      {children}
    </button>
  );
}

function Switch({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="grid h-11 w-14 shrink-0 place-items-center">
      <span className={cn('relative block h-7 w-12 rounded-full transition-colors motion-reduce:transition-none', on ? 'bg-royal' : 'bg-line')}>
        <i className={cn('absolute top-0.5 size-6 rounded-full bg-surface transition-[left] motion-reduce:transition-none', on ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

const goalsOf = (st) => ({
  goal: st.goal, industry: st.industry, minutes: st.minutes,
  tlKind: st.timeline.kind === 'unsure' ? 'unsure' : st.timeline.kind, tlDate: st.timeline.date || '',
});

export default function Account({ st, onPatch, onSaveGoals, onReset, onOpenWip }) {
  const [g, setG] = useState(() => goalsOf(st));
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permNote, setPermNote] = useState('');
  const [vibrates, setVibrates] = useState(true); // false on iPhones and desktops, which cannot vibrate from the browser
  useEffect(() => { setVibrates(canVibrate()); }, []);

  const base = goalsOf(st);
  const changed = JSON.stringify(g) !== JSON.stringify(base);
  const goalsOk = !!g.goal && !!g.industry && (g.tlKind !== 'date' || !!g.tlDate);

  const saveGoals = () => {
    onSaveGoals({
      goal: g.goal, industry: g.industry, minutes: g.minutes,
      timeline: { kind: g.tlKind, date: g.tlKind === 'date' ? g.tlDate : null },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleReminders = async (on) => {
    setPermNote('');
    if (!on) return onPatch({ remindOn: false });
    let perm = 'unsupported';
    try {
      if (typeof Notification !== 'undefined') {
        perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      }
    } catch {}
    if (perm === 'denied') setPermNote('Notifications are blocked in your browser settings.');
    onPatch({ remindPerm: perm, remindOn: perm === 'granted' || perm === 'unsupported' });
  };

  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: 'pitchd', data: st }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitchd-data-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copyStats = async () => {
    try { await navigator.clipboard.writeText(statsText(st)); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Copy your stats:', statsText(st)); }
  };

  return (
    <div className="main flex flex-col gap-4">
      <h1 className="text-[22px] font-bold tracking-tight">Account</h1>

      <Section title="Profile">
        <label>
          <Label>Name</Label>
          <input className={FIELD} value={st.name} maxLength={24} placeholder="First name" onChange={(e) => onPatch({ name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <Label>School</Label>
            <select className={FIELD} value={st.school} onChange={(e) => onPatch({ school: e.target.value })}>
              <option value="">Choose</option>
              {SCHOOLS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>
            <Label>Year</Label>
            <select className={FIELD} value={st.year} onChange={(e) => onPatch({ year: e.target.value })}>
              <option value="">Choose</option>
              {YEARS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
      </Section>

      <Section title="Track" hint="Your major sets your daily questions.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(TRACKS).map(([id, t]) => (
            <Chip key={id} on={st.track === id} onClick={() => st.track !== id && onPatch({ track: id })}>{t.label}</Chip>
          ))}
        </div>
        <button onClick={() => onOpenWip('premium')} className="flex items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3 text-left text-[14px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-2"><Lock size={14} strokeWidth={2.25} />Add a second track</span>
          {PREMIUM_TAG}
        </button>
      </Section>

      <Section title="Goals and timeline" hint="Saving restarts your plan from today.">
        <div>
          <Label>Preparing for</Label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((x) => <Chip key={x.id} on={g.goal === x.id} onClick={() => setG({ ...g, goal: x.id })}>{x.label}</Chip>)}
          </div>
        </div>
        <div>
          <Label>Industry</Label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((x) => <Chip key={x.id} on={g.industry === x.id} onClick={() => setG({ ...g, industry: x.id })}>{x.label}</Chip>)}
          </div>
        </div>
        <div>
          <Label>Next interview or recruiting season</Label>
          <div className="flex flex-wrap gap-2">
            {TIMELINES.map((x) => <Chip key={x.id} on={g.tlKind === x.id} onClick={() => setG({ ...g, tlKind: x.id })}>{x.label}</Chip>)}
          </div>
          {g.tlKind === 'date' && (
            <input type="date" aria-label="Interview date" className={cn(FIELD, 'mt-2.5')} min={todayStr()} value={g.tlDate} onChange={(e) => setG({ ...g, tlDate: e.target.value })} />
          )}
        </div>
        <div>
          <Label>Minutes a day</Label>
          <div className="flex gap-2">
            {MINUTES.map((m) => <Chip key={m} on={g.minutes === m} onClick={() => setG({ ...g, minutes: m })}>{m} min</Chip>)}
          </div>
        </div>
        <button
          disabled={!changed || !goalsOk}
          onClick={saveGoals}
          className={`${PRIMARY} ${SIZE.md} w-full`}
        >
          {saved ? <><Check size={17} strokeWidth={2.5} />Plan rebuilt</> : 'Save and rebuild my plan'}
        </button>
      </Section>

      <Section title="Reminders" hint="Reminders start working once accounts launch.">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">Daily reminder</span>
          <Switch on={st.remindOn} onChange={toggleReminders} label="Daily reminder" />
        </div>
        {permNote && <p className="text-[13px] font-semibold text-red-strong">{permNote}</p>}
        <label>
          <Label>Time of day</Label>
          <input type="time" className={FIELD} value={st.remindAt} onChange={(e) => e.target.value && onPatch({ remindAt: e.target.value })} />
        </label>
      </Section>

      <Section title="Sound and haptics" hint="Sounds are short and only play after you answer. Muting is instant.">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">Sound effects</span>
          <Switch
            on={st.sound}
            onChange={(on) => { setSoundEnabled(on); if (on) play('on'); onPatch({ sound: on }); }}
            label="Sound effects"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-[15px] font-semibold">Haptics</span>
            <span className="block text-[13px] font-medium text-muted-foreground">
              {vibrates ? 'A tiny buzz when you answer.' : "Your browser can't vibrate this device. Android phones can."}
            </span>
          </span>
          <Switch
            on={st.haptics !== false && vibrates}
            onChange={(on) => { if (!vibrates) return; setHapticsEnabled(on); if (on) vibrate(15); onPatch({ haptics: on }); }}
            label="Haptics"
          />
        </div>
      </Section>

      <Section title="Plan">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">Current plan</span>
          <span className="rounded-full bg-cyan-soft px-3 py-1 text-[13px] font-bold">{st.tier === 'premium' ? 'Premium' : 'Free'}</span>
        </div>
      </Section>

      <button onClick={() => onOpenWip()} className="flex items-center justify-between rounded-[28px] bg-royal p-5 text-left text-base font-bold text-white">
        <span>
          What's coming
          <span className="block text-[13px] font-medium text-white/85">Accounts, Premium, AI feedback, and more</span>
        </span>
        <ChevronRight size={18} strokeWidth={2.25} />
      </button>

      <Link href="/about" className="flex items-center justify-between rounded-[28px] bg-surface p-5 text-base font-bold active:scale-[0.99]">
        About Pitchd
        <ChevronRight size={18} strokeWidth={2.25} className="text-muted-foreground" />
      </Link>

      <Section title="Your data" hint="Everything is saved on this device only.">
        <button onClick={download} className={`${SECONDARY} ${SIZE.md}`}>
          <Download size={17} strokeWidth={2.25} />Download my data
        </button>
        <button onClick={copyStats} className={`${SECONDARY} ${SIZE.md}`}>
          {copied ? <><Check size={17} strokeWidth={2.5} />Copied</> : <><Copy size={17} strokeWidth={2.25} />Copy my stats</>}
        </button>
        <button
          onClick={() => { if (window.confirm('Delete all your Pitchd data on this device? This cannot be undone.')) onReset(); }}
          className="inline-flex min-h-11 items-center justify-center gap-2 text-[15px] font-semibold text-red-strong"
        >
          <Trash2 size={16} strokeWidth={2.25} />Delete my data
        </button>
        <p className="text-[13px] font-medium text-muted-foreground">
          Tip: add Pitchd to your home screen from your browser's share menu so it opens like an app.
        </p>
      </Section>
    </div>
  );
}
