'use client';
import { CAT_LABELS, currentStreak, mastery, lastNDays, quizCatsFor } from '@/lib/engine';
import Stagger from './ui/Stagger';
import Roadmap from './Roadmap';
import SkillMap from './SkillMap';
import Badges from './Badges';

/* -------------------------------- Progress ------------------------------- */
export function Progress({ st }) {
  const m = mastery(st);
  const cats = quizCatsFor(st.track);
  const days = lastNDays(21);
  return (
    <Stagger className="main">
      <div className="h1" style={{ marginBottom: 12 }}>Progress</div>
      <Roadmap st={st} />
      <SkillMap st={st} />
      <Badges st={st} />
      <div className="kpis">
        <div className="stat"><small>Streak</small><b>{currentStreak(st)}</b></div>
        <div className="stat"><small>Best</small><b>{st.best}</b></div>
        <div className="stat"><small>Answered</small><b>{m.answered}</b></div>
      </div>

      <div className="card">
        <h3>Accuracy by category</h3>
        {cats.map((c) => {
          const v = m.byCat[c];
          return (
            <div className="row" key={c}>
              <span>{CAT_LABELS[c]}</span>
              <div className="meter"><i style={{ width: `${v?.pct ?? 0}%` }} /></div>
              <em>{v ? v.pct + '%' : '--'}</em>
            </div>
          );
        })}
        <p>Based on every answer so far, including misses. Questions you master in Review count toward your mastered total.</p>
      </div>

      <div className="card">
        <h3>Last 3 weeks</h3>
        <div className="cal">{days.map((d) => <div key={d} className={st.history[d]?.setDone ? 'on' : ''} title={d} />)}</div>
      </div>
    </Stagger>
  );
}
