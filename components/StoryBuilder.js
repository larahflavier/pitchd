'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Lock, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { todayStr } from '@/lib/engine';
import {
  THEMES, themeById, STORY_CHECKS, STORY_TARGET, FREE_STORY_LIMIT, emptyStory, storyTags,
  canAddStory, isPremium, upsertStory, deleteStory,
} from '@/lib/interview';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

const FIELD = 'w-full rounded-[20px] border-2 border-line bg-surface p-4 text-[15px] font-medium outline-none focus:border-ink';
const PILL = `${PRIMARY} ${SIZE.lg} w-full`;
const PARTS = [
  ['situation', 'Situation', 'Where and when? What was happening?'],
  ['task', 'Task', 'What was your goal or responsibility?'],
  ['action', 'Action', 'What did you do? Use "I".'],
  ['result', 'Result', 'What happened? Add a number if you can.'],
];

export default function StoryBuilder({ st, onUpdate, onBack, onEditing }) {
  const [draft, setDraft] = useState(null);
  const stories = st.interview.stories;
  const premium = isPremium(st);
  const canAdd = canAddStory(st);
  const covered = new Set(stories.flatMap((s) => storyTags(s)));

  useEffect(() => { onEditing(!!draft); return () => onEditing(false); }, [!!draft]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- editor ---- */
  if (draft) {
    const tags = storyTags(draft);
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
    const toggleTag = (id) => set({ tags: tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id], tagsAuto: false });
    const toggleCheck = (c) => set({ checks: draft.checks.includes(c) ? draft.checks.filter((x) => x !== c) : [...draft.checks, c] });
    const isNew = !stories.some((s) => s.id === draft.id);
    const empty = !draft.title.trim() && !draft.situation && !draft.task && !draft.action && !draft.result;
    const save = () => {
      onUpdate((s) => upsertStory(s, { ...draft, title: draft.title.trim() || 'Untitled story', tags, updated: todayStr() }));
      setDraft(null);
    };
    return (
      <div className="main flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setDraft(null)} aria-label="Back" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface">
            <ArrowLeft size={18} strokeWidth={2.25} />
          </button>
          <h1 className="text-[22px] font-bold tracking-tight">{isNew ? 'New story' : 'Edit story'}</h1>
        </div>

        <input className={cn(FIELD, 'py-3.5 font-semibold')} placeholder="Give it a short title" maxLength={60} value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        {PARTS.map(([key, label, hint]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-[15px] font-bold">{label}</span>
            <textarea className={cn(FIELD, 'min-h-[96px] resize-none')} placeholder={hint} value={draft[key]} onChange={(e) => set({ [key]: e.target.value })} />
          </label>
        ))}

        <section className="rounded-[24px] bg-surface p-4">
          <h2 className="text-[15px] font-bold">Questions this story answers</h2>
          <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
            {draft.tagsAuto ? 'Suggested from your text. Tap to change.' : 'Your choices. Tap to change.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const on = tags.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTag(t.id)} aria-pressed={on}
                  className={cn('rounded-full border-2 px-3.5 py-2 text-[13px] font-semibold', on ? 'border-ink bg-periwinkle-soft' : 'border-line')}>
                  {t.label}
                </button>
              );
            })}
          </div>
          {tags.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-[13px] font-medium text-muted-foreground">
              {tags.map((id) => <li key={id}>{themeById[id].q}</li>)}
            </ul>
          )}
        </section>

        <section className="rounded-[24px] bg-surface p-4">
          <h2 className="text-[15px] font-bold">Self-check</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {STORY_CHECKS.map((c) => {
              const on = draft.checks.includes(c);
              return (
                <li key={c}>
                  <button onClick={() => toggleCheck(c)} aria-pressed={on}
                    className={cn('flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left text-[14px] font-semibold', on ? 'border-teal bg-teal-soft' : 'border-line')}>
                    <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2', on ? 'border-royal bg-cyan text-royal' : 'border-line')}>
                      {on && <Check size={13} strokeWidth={3.5} />}
                    </span>
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-periwinkle-soft p-3 text-[13px] font-semibold">
            <Lock size={14} strokeWidth={2.25} className="shrink-0" />
            <span className="flex-1">AI feedback on this story</span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold">Premium</span>
          </div>
        </section>

        <button className={PILL} disabled={empty} onClick={save}>Save story</button>
        {!isNew && (
          <button
            className="inline-flex items-center justify-center gap-2 py-2 text-[15px] font-semibold text-red"
            onClick={() => { if (window.confirm('Delete this story?')) { onUpdate((s) => deleteStory(s, draft.id)); setDraft(null); } }}
          >
            <Trash2 size={16} strokeWidth={2.25} />Delete story
          </button>
        )}
      </div>
    );
  }

  /* ---- list ---- */
  return (
    <div className="main flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface">
          <ArrowLeft size={18} strokeWidth={2.25} />
        </button>
        <h1 className="text-[22px] font-bold tracking-tight">Story builder</h1>
      </div>
      <p className="text-[15px] font-medium text-muted-foreground">
        Write 5 or 6 STAR stories once. Each one is tagged to the behavioral questions it can answer.
      </p>

      <div className="rounded-[24px] bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Questions covered</h2>
          <span className="text-[13px] font-bold text-muted-foreground">{covered.size} of {THEMES.length}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <span key={t.id} className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold', covered.has(t.id) ? 'bg-teal-soft' : 'border border-line text-muted-foreground')}>
              {covered.has(t.id) && <Check size={12} strokeWidth={3} />}{t.label}
            </span>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {stories.map((s) => (
          <li key={s.id}>
            <button onClick={() => setDraft({ ...s })} className="w-full rounded-[24px] bg-surface p-4 text-left active:scale-[0.99]">
              <span className="block text-base font-bold">{s.title || 'Untitled story'}</span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {storyTags(s).map((id) => <span key={id} className="rounded-full bg-periwinkle-soft px-2.5 py-0.5 text-[12px] font-semibold">{themeById[id].label}</span>)}
                {storyTags(s).length === 0 && <span className="text-[12px] font-medium text-muted-foreground">No tags yet</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {canAdd ? (
        <button className={PILL} onClick={() => setDraft({ ...emptyStory(), id: 'st-' + Date.now() })}>
          <Plus size={18} strokeWidth={2.5} />New story
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-[24px] bg-periwinkle-soft p-4">
          <Lock size={18} strokeWidth={2.25} className="shrink-0" />
          <span className="flex-1 text-[14px] font-semibold">You've used your {FREE_STORY_LIMIT} free stories. Unlimited stories are a Premium feature.</span>
          <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold">Premium</span>
        </div>
      )}
      <p className="text-center text-[13px] font-medium text-muted-foreground">
        {premium ? `${stories.length} of ${STORY_TARGET} suggested stories` : `${stories.length} of ${FREE_STORY_LIMIT} free stories`}
      </p>
    </div>
  );
}
