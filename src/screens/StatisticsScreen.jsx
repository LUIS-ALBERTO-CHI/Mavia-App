import { useApp } from '../context/AppContext';
import { Flame, CheckCircle2, Target, Headphones, TrendingUp, Award, BarChart2 } from 'lucide-react';
import { Progress } from '../components/ui/progress';

/* ── KPI card ── */
function KpiCard({ icon: Icon, iconColor, iconBg, label, value, sub, wide }) {
  return (
    <div
      className={`st-kpi${wide ? ' wide' : ''}`}
      style={wide ? { background: 'var(--gradient-primary)', color: 'white' } : {}}
    >
      <div className="st-kpi-icon" style={{ background: iconBg }}>
        <Icon size={22} color={iconColor} strokeWidth={1.75} />
      </div>
      <div className="st-kpi-body">
        <div className="st-kpi-val" style={wide ? { color: 'white' } : {}}>{value}</div>
        <div className="st-kpi-label" style={wide ? { color: 'rgba(255,255,255,0.85)' } : {}}>{label}</div>
        {sub && (
          <div className="st-kpi-sub" style={wide ? { color: 'rgba(255,255,255,0.65)' } : {}}>{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── Vertical bar chart ── */
function WeekChart({ data, labels, highlight }) {
  const max = Math.max(...data, 1);
  return (
    <div className="st-bar-chart">
      {data.map((v, i) => {
        const pct   = Math.round((v / max) * 100);
        const isHigh = i === highlight;
        return (
          <div key={i} className="st-bar-col">
            <span className="st-bar-val">{v > 0 ? v : ''}</span>
            <div className="st-bar-track">
              <div
                className="st-bar-fill"
                style={{
                  height: `${Math.max(pct, v > 0 ? 8 : 4)}%`,
                  background: isHigh
                    ? 'var(--gradient-primary)'
                    : 'linear-gradient(to top, var(--primary-container), var(--primary-fixed))',
                  opacity: v === 0 ? 0.3 : 1,
                }}
              />
            </div>
            <span className="st-bar-day">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Habit week dots ── */
function HabitRow({ habit }) {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const streak = habit.streak || 0;
  return (
    <div className="st-habit-row">
      <div className="st-habit-info">
        <span className="st-habit-name">{habit.name}</span>
        <span className="st-habit-streak">
          <Flame size={13} color="#E56B4E" strokeWidth={2} />
          {streak} días
        </span>
      </div>
      <div className="st-habit-dots">
        {(habit.weekData || Array(7).fill(false)).map((done, i) => (
          <div
            key={i}
            className={`st-dot${done ? ' done' : ''}`}
            style={done ? { background: habit.color } : {}}
            title={days[i]}
          />
        ))}
      </div>
    </div>
  );
}

const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/* ── Compute tasks completed per weekday THIS week (Mon–Sun) ── */
function getWeekTaskCounts(tasks) {
  const now   = new Date();
  const day   = now.getDay();           // 0=Sun … 6=Sat
  const mon   = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7)); // Monday of current week
  mon.setHours(0, 0, 0, 0);

  const counts = Array(7).fill(0);

  tasks.forEach(t => {
    if (!t.completed) return;
    const d = t.date;   // 'date' is the only date field in the task model
    if (!d) return;
    const dt = new Date(d + 'T00:00:00');
    dt.setHours(0, 0, 0, 0);
    const diff = Math.round((dt - mon) / 86400000);
    if (diff >= 0 && diff < 7) counts[diff]++;
  });

  return counts;
}

export default function StatisticsScreen() {
  const { state } = useApp();
  const { tasks, habits, goals, meditations, user } = state;

  // App usage streak
  const appStreak = user?.appStreak || 0;

  // ── Tasks ──
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ── Habits ──
  const habitsDoneToday = habits.filter(h => h.completedToday).length;
  // Guard: streak may be undefined if older Firestore docs lack the field
  const maxStreak = habits.length
    ? Math.max(...habits.map(h => Number(h.streak) || 0))
    : 0;

  // ── Goals ──
  const avgGoal = goals.length
    ? Math.round(goals.reduce((a, g) => a + (Number(g.progress) || 0), 0) / goals.length)
    : 0;

  // ── Meditations ──
  const totalMedPlays = meditations.reduce((a, m) => a + (m.plays || 0), 0);

  // ── Weekly chart data (real) ──
  const weekCounts = getWeekTaskCounts(tasks);
  const todayIdx   = (new Date().getDay() + 6) % 7; // Mon=0

  return (
    <>
      <style>{`
        /* ======= STATISTICS SCREEN ======= */
        .st-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 920px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .st-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .st-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── KPI grid ── */
        .st-kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        @media (min-width: 640px) {
          .st-kpi-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .st-kpi {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform var(--transition-spring);
        }
        .st-kpi:hover { transform: translateY(-2px); }

        .st-kpi.wide {
          grid-column: 1 / -1;
          flex-direction: row;
          align-items: center;
          gap: var(--space-lg);
          box-shadow: 0 12px 40px rgba(112,87,101,0.22);
          border: none;
        }
        @media (min-width: 640px) {
          .st-kpi.wide { grid-column: span 2; }
        }

        .st-kpi-icon {
          width: 44px; height: 44px;
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .st-kpi.wide .st-kpi-icon {
          width: 60px; height: 60px;
          background: var(--surface-container-low) !important;
        }
        .st-kpi-body { flex: 1; }
        .st-kpi-val {
          font-family: var(--font-display);
          font-size: 2.2rem; font-weight: 500;
          color: var(--on-surface);
          line-height: 1; margin-bottom: 4px;
        }
        .st-kpi.wide .st-kpi-val { font-size: 3rem; }
        .st-kpi-label {
          font-size: var(--text-label-md); font-weight: 600;
          color: var(--on-surface-variant);
        }
        .st-kpi-sub {
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
          margin-top: 3px; opacity: 0.8;
        }

        /* ── Section card ── */
        .st-section {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
        }
        .st-section-head {
          display: flex; align-items: center;
          gap: var(--space-md); margin-bottom: var(--space-xl);
        }
        .st-section-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .st-section-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md); font-weight: 500;
          color: var(--on-surface);
        }

        /* ── Bar chart ── */
        .st-bar-chart {
          display: flex; align-items: flex-end;
          gap: var(--space-sm); height: 120px;
        }
        .st-bar-col {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 4px; height: 100%;
        }
        .st-bar-val {
          font-size: 9px; font-weight: 700;
          color: var(--on-surface-variant);
          min-height: 12px; line-height: 1;
        }
        .st-bar-track {
          flex: 1; width: 100%;
          display: flex; align-items: flex-end;
          border-radius: 6px; overflow: hidden;
        }
        .st-bar-fill {
          width: 100%; border-radius: 6px 6px 0 0;
          transition: height 0.9s var(--ease-out); min-height: 4px;
        }
        .st-bar-day {
          font-size: 10px; font-weight: 700;
          color: var(--on-surface-variant); text-align: center;
        }

        /* ── Goals ── */
        .st-goal-row { margin-bottom: var(--space-lg); }
        .st-goal-row:last-child { margin-bottom: 0; }
        .st-goal-meta {
          display: flex; justify-content: space-between;
          align-items: baseline; margin-bottom: 6px;
        }
        .st-goal-name {
          font-size: var(--text-label-md); font-weight: 600;
          color: var(--on-surface); flex: 1;
          margin-right: var(--space-md);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .st-goal-pct {
          font-family: var(--font-display);
          font-size: var(--text-headline-md); font-weight: 500;
          color: var(--primary); flex-shrink: 0;
        }

        /* ── Habit rows ── */
        .st-habit-row {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(208,195,200,0.15);
          gap: var(--space-md);
        }
        .st-habit-row:last-child { border-bottom: none; }
        .st-habit-info {
          display: flex; align-items: center;
          gap: var(--space-sm); min-width: 0;
        }
        .st-habit-name {
          font-size: var(--text-label-md); font-weight: 600;
          color: var(--on-surface);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .st-habit-streak {
          display: flex; align-items: center; gap: 3px;
          font-size: var(--text-label-sm); font-weight: 600;
          color: var(--on-surface-variant); flex-shrink: 0;
        }
        .st-habit-dots { display: flex; gap: 5px; flex-shrink: 0; }
        .st-dot {
          width: 24px; height: 24px; border-radius: 7px;
          background: var(--surface-container);
          transition: all var(--transition-fast);
        }
        .st-dot.done { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }

        /* ── Empty state ── */
        .st-empty {
          text-align: center; padding: 24px 0;
          color: var(--on-surface-variant);
          font-size: var(--text-body-md); opacity: 0.7;
        }

        @media (max-width: 480px) {
          .st-dot { width: 18px; height: 18px; border-radius: 5px; }
          .st-habit-dots { gap: 3px; }
        }
      `}</style>

      <div className="st-screen">

        {/* ── Hero ── */}
        <h1 className="st-hero-title">Estadísticas</h1>
        <p className="st-hero-sub">Una mirada al progreso de tu bienestar y productividad.</p>

        {/* ── KPI Grid ── */}
        <div className="st-kpi-grid">

          {/* Wide: tasks */}
          <KpiCard
            wide
            icon={CheckCircle2}
            iconColor="white"
            iconBg="rgba(255,255,255,0.18)"
            value={`${completedTasks} / ${totalTasks}`}
            label="Tareas completadas"
            sub={
              totalTasks === 0
                ? 'Aún no tienes tareas'
                : `${completionRate}% del total · ${completionRate === 100 ? '¡Perfecto! 🌸' : 'Sigue así 💪'}`
            }
          />

          {/* Streak hábitos */}
          <KpiCard
            icon={Flame}
            iconColor="#E56B4E"
            iconBg="rgba(229,107,78,0.12)"
            value={maxStreak}
            label="Racha hábito"
            sub={maxStreak === 1 ? 'día seguido' : 'días seguidos'}
          />

          {/* Racha de app */}
          <KpiCard
            icon={TrendingUp}
            iconColor="var(--secondary)"
            iconBg="var(--secondary-container)"
            value={appStreak}
            label="Racha Mavia"
            sub={appStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
          />

          {/* Meditations */}
          <KpiCard
            icon={Headphones}
            iconColor="var(--primary)"
            iconBg="var(--primary-container)"
            value={totalMedPlays}
            label="Meditaciones"
            sub="sesiones totales"
          />

          {/* Habits today */}
          <KpiCard
            icon={CheckCircle2}
            iconColor="var(--secondary)"
            iconBg="var(--secondary-container)"
            value={`${habitsDoneToday}/${habits.length}`}
            label="Hábitos hoy"
            sub="completados"
          />

          {/* Goals avg */}
          <KpiCard
            icon={Target}
            iconColor="var(--tertiary)"
            iconBg="var(--tertiary-container)"
            value={`${avgGoal}%`}
            label="Promedio metas"
            sub="progreso global"
          />

        </div>

        {/* ── Weekly bar chart (real data) ── */}
        <div className="st-section">
          <div className="st-section-head">
            <div className="st-section-icon" style={{ background: 'var(--primary-container)' }}>
              <BarChart2 size={18} color="var(--primary)" strokeWidth={1.75} />
            </div>
            <span className="st-section-title">Tareas completadas — esta semana</span>
          </div>
          {weekCounts.every(v => v === 0) ? (
            <p className="st-empty">No hay tareas completadas esta semana</p>
          ) : (
            <WeekChart data={weekCounts} labels={WEEK_LABELS} highlight={todayIdx} />
          )}
        </div>

        {/* ── Goals progress ── */}
        <div className="st-section">
          <div className="st-section-head">
            <div className="st-section-icon" style={{ background: 'var(--tertiary-container)' }}>
              <TrendingUp size={18} color="var(--tertiary)" strokeWidth={1.75} />
            </div>
            <span className="st-section-title">Progreso de objetivos</span>
          </div>
          {goals.length === 0 ? (
            <p className="st-empty">Aún no tienes objetivos</p>
          ) : (
            goals.map(g => (
              <div key={g.id} className="st-goal-row">
                <div className="st-goal-meta">
                  <span className="st-goal-name">{g.title}</span>
                  <span className="st-goal-pct">{Number(g.progress) || 0}%</span>
                </div>
                <Progress
                  value={Number(g.progress) || 0}
                  color={
                    g.category === 'Marketing'  ? 'secondary'  :
                    g.category === 'Personal'   ? 'primary'    :
                    g.category === 'Espiritual' ? 'tertiary'   : 'primary'
                  }
                />
              </div>
            ))
          )}
        </div>

        {/* ── Habits week grid ── */}
        <div className="st-section">
          <div className="st-section-head">
            <div className="st-section-icon" style={{ background: 'rgba(229,107,78,0.12)' }}>
              <Award size={18} color="#E56B4E" strokeWidth={1.75} />
            </div>
            <span className="st-section-title">Hábitos — Semana actual</span>
          </div>
          {habits.length === 0 ? (
            <p className="st-empty">Aún no tienes hábitos</p>
          ) : (
            habits.map(h => <HabitRow key={h.id} habit={h} />)
          )}
        </div>

      </div>
    </>
  );
}
