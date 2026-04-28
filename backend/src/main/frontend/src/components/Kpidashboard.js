import React, { useEffect, useState, useMemo } from 'react';
import API_LIST from '../API';
import { MOCK_TASKS } from '../features/tasks/useTaskWorkspace';

// $50,000/year fulltime (40hrs/week, 52 weeks = 2080 hrs)
const COST_PER_HOUR = 50000 / 2080; // ~$24.04

const TEAM_MEMBERS = ['Joaquín', 'Esteban', 'Juan Pablo', 'Fernanda', 'Emilio'];
const MEMBER_COLORS = {
  'Joaquín':    '#4A9EFF',
  'Esteban':    '#FF6B35',
  'Juan Pablo': '#51CF66',
  'Fernanda':   '#FF6B9D',
  'Emilio':     '#FFD43B',
};
const SPRINT_COLORS = {
  'Sprint 0': '#A78BFA',
  'Sprint 1': '#4A9EFF',
  'Sprint 2': '#FF6B35',
  'Sprint 3': '#51CF66',
  'Sprint 4': '#FF6B9D',
  'Sprint 5': '#FFD43B',
};
const ACTIVE_SPRINTS = ['Sprint 0', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'];
const MEMBER_DASH = {
  'Joaquín':    null,
  'Esteban':    '8 4',
  'Juan Pablo': null,
  'Fernanda':   '4 4',
  'Emilio':     '2 4',
};
const MEMBER_ALIASES = {
  'Joaquín': ['joaquin', 'joaquín'],
  'Esteban': ['esteban'],
  'Juan Pablo': ['juan pablo', 'juanpablo', 'juan'],
  'Fernanda': ['fernanda'],
  'Emilio': ['emilio'],
};

// ─── Grouped bar chart ────────────────────────────────────────────────────────
function GroupedBarChart({ title, subtitle, groups, series, colorMap, yLabel, yFormat }) {
  const allVals = groups.flatMap(g => series.map(s => g[s] || 0));
  const maxVal = Math.max(...allVals, 1);
  const chartH = 200;
  const barW = 22;
  const gap = 4;
  const groupGap = 20;
  const groupW = series.length * (barW + gap) - gap + groupGap;
  const totalW = groups.length * groupW;

  function fmt(v) {
    if (yFormat === 'usd') return `$${Math.round(v).toLocaleString()}`;
    return v % 1 === 0 ? String(v) : v.toFixed(1);
  }

  return (
    <div style={{ background: 'var(--surface-secondary)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>{title}</h3>
      {subtitle && <p style={{ margin: '0 0 1rem', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{subtitle}</p>}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
        {series.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: colorMap[s] || '#6b7280' }} />
            <span style={{ fontSize: '14px', color: '#FFFFFF' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ overflowX: 'auto' }}>
        <svg width={Math.max(totalW + 60, 400)} height={chartH + 60} style={{ display: 'block' }}>
          {/* Y gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = 10 + chartH * (1 - pct);
            const val = maxVal * pct;
            return (
              <g key={pct}>
                <line x1={50} x2={totalW + 60} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 3" />
                <text x={45} y={y + 4} textAnchor="end" fontSize="13" fill="rgba(255,255,255,0.85)">{fmt(val)}</text>
              </g>
            );
          })}

          {/* Y axis label */}
          <text transform={`translate(12, ${10 + chartH / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)">{yLabel}</text>

          {/* Bars */}
          {groups.map((group, gi) => {
            const gx = 55 + gi * groupW;
            return (
              <g key={gi}>
                {series.map((s, si) => {
                  const val = group[s] || 0;
                  const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
                  const x = gx + si * (barW + gap);
                  const y = 10 + chartH - barH;
                  return (
                    <g key={s}>
                      <rect x={x} y={y} width={barW} height={barH} fill={colorMap[s] || '#6b7280'} rx="2" opacity="0.9">
                        <title>{`${group.label} — ${s}: ${fmt(val)}`}</title>
                      </rect>
                      {val > 0 && barH > 14 && (
                        <text x={x + barW / 2} y={y + 11} textAnchor="middle" fontSize="13" fill="white" fontWeight="600">{fmt(val)}</text>
                      )}
                    </g>
                  );
                })}
                {/* Group label */}
                <text
                  x={gx + (series.length * (barW + gap) - gap) / 2}
                  y={10 + chartH + 16}
                  textAnchor="middle" fontSize="13" fill="#FFFFFF"
                >{group.label}</text>
              </g>
            );
          })}

          {/* X axis */}
          <line x1={50} x2={totalW + 60} y1={10 + chartH} y2={10 + chartH} stroke="var(--border-default)" />
        </svg>
      </div>
    </div>
  );
}

// ─── Line chart ───────────────────────────────────────────────────────────────
function LineChart({ title, subtitle, sprints, series, colorMap, dashMap, yLabel }) {
  const allVals = series.flatMap(s => sprints.map(sp => s.data[sp] || 0));
  const maxVal = Math.max(...allVals, 1);
  const chartH = 200;
  const chartW = 600;
  const padL = 55, padR = 20, padT = 10, padB = 50;

  function xPos(i) {
    if (sprints.length === 1) return padL + chartW / 2;
    return padL + (i / (sprints.length - 1)) * (chartW - padL * 0.5);
  }
  function yPos(v) { return padT + chartH * (1 - v / maxVal); }

  return (
    <div style={{ background: 'var(--surface-secondary)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>{title}</h3>
      {subtitle && <p style={{ margin: '0 0 1rem', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{subtitle}</p>}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
        {series.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '3px', background: colorMap[s.label] || '#6b7280', borderRadius: '2px' }} />
            <span style={{ fontSize: '14px', color: '#FFFFFF' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartW + padL + padR} ${chartH + padT + padB}`} width="100%" height="100%" style={{ display: 'block', minHeight: chartH + padT + padB }}>
          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padT + chartH * (1 - pct);
            return (
              <g key={pct}>
                <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 3" />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="13" fill="rgba(255,255,255,0.85)">{Math.round(maxVal * pct)}</text>
              </g>
            );
          })}

          {/* Y label */}
          <text transform={`translate(12, ${padT + chartH / 2}) rotate(-90)`} textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.85)">{yLabel}</text>

          {/* X axis baseline — rendered before lines so zero-value lines appear on top */}
          <line x1={padL} x2={padL + chartW} y1={padT + chartH} y2={padT + chartH} stroke="var(--border-default)" />

          {/* Lines — dashed series sorted last so they render on top of solid lines */}
          {[...series].sort((a, b) => (dashMap?.[a.label] ? 1 : 0) - (dashMap?.[b.label] ? 1 : 0)).map(s => {
            const pts = sprints.map((sp, i) => `${xPos(i)},${yPos(s.data[sp] || 0)}`).join(' ');
            const isDashed = !!dashMap?.[s.label];
            return (
              <g key={s.label}>
                <polyline points={pts} fill="none" stroke={colorMap[s.label] || '#6b7280'} strokeWidth={isDashed ? 4 : 3} strokeDasharray={dashMap?.[s.label] || undefined} />
                {sprints.map((sp, i) => {
                  const val = s.data[sp] || 0;
                  return (
                    <g key={sp}>
                      <circle cx={xPos(i)} cy={yPos(val)} r="6" fill={colorMap[s.label] || '#6b7280'} stroke="var(--surface-secondary)" strokeWidth="2" />
                      <title>{`${s.label} — ${sp}: ${val.toFixed(1)}h`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* X axis labels */}
          {sprints.map((sp, i) => (
            <text key={sp} x={xPos(i)} y={padT + chartH + 20} textAnchor="middle" fontSize="13" fill="#FFFFFF">{sp}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function KPIDashboard({ tasks: providedTasks = null }) {
  const [tasks, setTasks] = useState(providedTasks || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (providedTasks) {
      setTasks(providedTasks);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    fetch(API_LIST)
      .then(async (r) => {
        if (!r.ok) throw new Error('Error loading tasks');
        const contentType = r.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('API returned non-JSON payload');
        }
        return r.json();
      })
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => {
        setTasks(MOCK_TASKS);
        setError(null);
        setLoading(false);
      });
  }, [providedTasks]);

  const kpis = useMemo(() => {
    function normalizeText(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    }

    function getText(...values) {
      return values.filter(Boolean).join(' ');
    }

    function getRealHours(task) {
      const value = task.realHours ?? task.horasReales ?? task.actualHours ?? 0;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function isCompleted(task) {
      const status = String(task.status || task.estado || '').toLowerCase();
      return Boolean(task.done) || ['completada', 'done', 'cerrada'].includes(status);
    }

    function getDevName(task) {
      const assignedUser = typeof task.assignedUser === 'object'
        ? getText(task.assignedUser.name, task.assignedUser.nombre, task.assignedUser.username)
        : task.assignedUser;
      const assigned = normalizeText(assignedUser);
      for (const m of TEAM_MEMBERS) {
        if (MEMBER_ALIASES[m].some(alias => assigned.includes(normalizeText(alias)))) return m;
      }
      return null;
    }

    function getSprintName(task) {
      if (task.sprint != null) {
        const rawSprint = String(task.sprint).trim();
        const name = rawSprint.toLowerCase().startsWith('sprint ') ? rawSprint : `Sprint ${rawSprint}`;
        if (ACTIVE_SPRINTS.includes(name)) return name;
      }
      const desc = getText(task.descripcion, task.description, task.rawDescription, task.title).toLowerCase();
      for (const sp of ACTIVE_SPRINTS) {
        if (desc.includes(sp.toLowerCase())) return sp;
      }
      return null;
    }

    // Filter sprints that have at least 1 task
    const usedSprints = ACTIVE_SPRINTS.filter(sp =>
      tasks.some(t => getSprintName(t) === sp)
    );
    const sprints = usedSprints.length > 0 ? usedSprints : ['Sprint 1'];

    // Chart 1: Completed tasks per developer per sprint
    // Groups = sprints, series = developers
    const chart1Groups = sprints.map(sp => {
      const spTasks = tasks.filter(t => getSprintName(t) === sp && isCompleted(t));
      const entry = { label: sp };
      TEAM_MEMBERS.forEach(dev => {
        entry[dev] = spTasks.filter(t => getDevName(t) === dev).length;
      });
      return entry;
    });

    // Chart 2: Real hours per developer per sprint (line)
    const chart2Series = TEAM_MEMBERS.map(dev => {
      const data = {};
      sprints.forEach(sp => {
        const hrs = tasks
          .filter(t => getSprintName(t) === sp && getDevName(t) === dev)
          .reduce((s, t) => s + getRealHours(t), 0);
        data[sp] = Math.round(hrs * 10) / 10;
      });
      return { label: dev, data };
    });

    const chart2SeriesFiltered = chart2Series.filter(s =>
      Object.values(s.data).some(v => v > 0)
    );

    // Chart 3: Cost per developer per sprint
    // Groups = developers, series = sprints
    const chart3Groups = TEAM_MEMBERS.map(dev => {
      const entry = { label: dev };
      sprints.forEach(sp => {
        const hrs = tasks
          .filter(t => getSprintName(t) === sp && getDevName(t) === dev)
          .reduce((s, t) => s + getRealHours(t), 0);
        entry[sp] = Math.round(hrs * COST_PER_HOUR);
      });
      return entry;
    });

    // Summary stats
    const totalHrs = tasks.reduce((s, t) => s + getRealHours(t), 0);
    const totalCost = totalHrs * COST_PER_HOUR;
    const completedTasks = tasks.filter(isCompleted).length;

    return { chart1Groups, chart2Series: chart2SeriesFiltered, chart3Groups, sprints, totalHrs, totalCost, completedTasks };
  }, [tasks]);

  if (loading) return <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.75)' }}>Loading KPIs...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>Error: {error}</div>;

  return (
    <section>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>KPI Dashboard</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
          {tasks.length} tasks total · {kpis.completedTasks} completed · {Math.round(kpis.totalHrs)}h logged · ${Math.round(kpis.totalCost).toLocaleString()} USD total cost
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
          Cost formula: real hours × ${COST_PER_HOUR.toFixed(2)}/hr ($50,000/yr ÷ 2,080 hrs)
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Chart 1: Tasks completed per developer per sprint */}
        <GroupedBarChart
          title="Tareas Completadas por Sprint"
          subtitle="Grouped by developer — completed tasks only"
          groups={kpis.chart1Groups}
          series={TEAM_MEMBERS}
          colorMap={MEMBER_COLORS}
          yLabel="Tareas"
        />

        {/* Chart 2: Real hours per developer (line trend) */}
        <LineChart
          title="Horas Reales por Desarrollador (tendencia)"
          subtitle="Real hours logged per developer across sprints"
          sprints={kpis.sprints}
          series={kpis.chart2Series}
          colorMap={MEMBER_COLORS}
          dashMap={MEMBER_DASH}
          yLabel="Horas"
        />

        {/* Chart 3: Cost per developer per sprint */}
        <GroupedBarChart
          title="Costo por Desarrollador por Sprint (USD)"
          subtitle={`Cost = real hours × $${COST_PER_HOUR.toFixed(2)}/hr`}
          groups={kpis.chart3Groups}
          series={kpis.sprints}
          colorMap={SPRINT_COLORS}
          yLabel="USD"
          yFormat="usd"
        />
      </div>
    </section>
  );
}

export default KPIDashboard;