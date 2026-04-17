import React, { useEffect, useState, useMemo } from 'react';
import API_LIST from '../API';

// $50,000/year fulltime (40hrs/week, 52 weeks = 2080 hrs)
const COST_PER_HOUR = 50000 / 2080; // ~$24.04

const TEAM_MEMBERS = ['Joaquín', 'Esteban', 'Juan Pablo', 'Fernanda', 'Emilio'];
const MEMBER_COLORS = {
  'Joaquín':    '#4472c4',
  'Esteban':    '#ed7d31',
  'Juan Pablo': '#a9d18e',
  'Fernanda':   '#7030a0',
  'Emilio':     '#00b0f0',
};
const SPRINT_COLORS = {
  'Sprint 1': '#4472c4',
  'Sprint 2': '#ed7d31',
  'Sprint 3': '#a9d18e',
  'Sprint 4': '#7030a0',
  'Sprint 5': '#00b0f0',
};
const ACTIVE_SPRINTS = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'];

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
    <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{subtitle}</p>}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
        {series.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: colorMap[s] || '#6b7280' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s}</span>
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
                <text x={45} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)">{fmt(val)}</text>
              </g>
            );
          })}

          {/* Y axis label */}
          <text transform={`translate(12, ${10 + chartH / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">{yLabel}</text>

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
                        <text x={x + barW / 2} y={y + 11} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">{fmt(val)}</text>
                      )}
                    </g>
                  );
                })}
                {/* Group label */}
                <text
                  x={gx + (series.length * (barW + gap) - gap) / 2}
                  y={10 + chartH + 16}
                  textAnchor="middle" fontSize="11" fill="var(--text-secondary)"
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
function LineChart({ title, subtitle, sprints, series, colorMap, yLabel }) {
  const allVals = series.flatMap(s => sprints.map(sp => s.data[sp] || 0));
  const maxVal = Math.max(...allVals, 1);
  const chartH = 200;
  const chartW = 500;
  const padL = 55, padR = 20, padT = 10, padB = 50;

  function xPos(i) { return padL + (i / (sprints.length - 1)) * chartW; }
  function yPos(v) { return padT + chartH * (1 - v / maxVal); }

  return (
    <div style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{subtitle}</p>}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
        {series.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '3px', background: colorMap[s.label] || '#6b7280', borderRadius: '2px' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg width={chartW + padL + padR} height={chartH + padT + padB} style={{ display: 'block' }}>
          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padT + chartH * (1 - pct);
            return (
              <g key={pct}>
                <line x1={padL} x2={padL + chartW} y1={y} y2={y} stroke="var(--border-subtle)" strokeDasharray="4 3" />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)">{Math.round(maxVal * pct)}</text>
              </g>
            );
          })}

          {/* Y label */}
          <text transform={`translate(12, ${padT + chartH / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">{yLabel}</text>

          {/* Lines */}
          {series.map(s => {
            const pts = sprints.map((sp, i) => `${xPos(i)},${yPos(s.data[sp] || 0)}`).join(' ');
            return (
              <g key={s.label}>
                <polyline points={pts} fill="none" stroke={colorMap[s.label] || '#6b7280'} strokeWidth="2.5" />
                {sprints.map((sp, i) => {
                  const val = s.data[sp] || 0;
                  return (
                    <g key={sp}>
                      <circle cx={xPos(i)} cy={yPos(val)} r="4" fill={colorMap[s.label] || '#6b7280'} />
                      <title>{`${s.label} — ${sp}: ${val.toFixed(1)}h`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* X axis labels */}
          {sprints.map((sp, i) => (
            <text key={sp} x={xPos(i)} y={padT + chartH + 20} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{sp}</text>
          ))}

          <line x1={padL} x2={padL + chartW} y1={padT + chartH} y2={padT + chartH} stroke="var(--border-default)" />
        </svg>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function KPIDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(API_LIST)
      .then(r => { if (!r.ok) throw new Error('Error loading tasks'); return r.json(); })
      .then(data => { setTasks(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const kpis = useMemo(() => {
    function getDevName(task) {
      const assigned = task.assignedUser || '';
      for (const m of TEAM_MEMBERS) {
        if (assigned.includes(m)) return m;
      }
      return null;
    }

    function getSprintName(task) {
      const desc = (task.sprint || task.descripcion || task.description || '').toLowerCase();
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
      const spTasks = tasks.filter(t => getSprintName(t) === sp && t.done);
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
          .reduce((s, t) => s + (parseFloat(t.horasReales) || 0), 0);
        data[sp] = Math.round(hrs * 10) / 10;
      });
      return { label: dev, data };
    });

    // Chart 3: Cost per developer per sprint
    // Groups = developers, series = sprints
    const chart3Groups = TEAM_MEMBERS.map(dev => {
      const entry = { label: dev };
      sprints.forEach(sp => {
        const hrs = tasks
          .filter(t => getSprintName(t) === sp && getDevName(t) === dev)
          .reduce((s, t) => s + (parseFloat(t.horasReales) || 0), 0);
        entry[sp] = Math.round(hrs * COST_PER_HOUR);
      });
      return entry;
    });

    // Summary stats
    const totalHrs = tasks.reduce((s, t) => s + (parseFloat(t.horasReales) || 0), 0);
    const totalCost = totalHrs * COST_PER_HOUR;
    const completedTasks = tasks.filter(t => t.done).length;

    return { chart1Groups, chart2Series, chart3Groups, sprints, totalHrs, totalCost, completedTasks };
  }, [tasks]);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-tertiary)' }}>Loading KPIs...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>Error: {error}</div>;

  return (
    <section>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>KPI Dashboard</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {tasks.length} tasks total · {kpis.completedTasks} completed · {Math.round(kpis.totalHrs)}h logged · ${Math.round(kpis.totalCost).toLocaleString()} USD total cost
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-placeholder)' }}>
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