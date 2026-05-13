import React, { useEffect, useState, useMemo } from 'react';
import API_LIST from '../API';
import { MOCK_TASKS } from '../features/tasks/useTaskWorkspace';

// $50,000/year fulltime (40hrs/week, 52 weeks = 2080 hrs)
const COST_PER_HOUR = 50000 / 2080; // ~$24.04

const TEAM_MEMBERS = ['Joaquín', 'Esteban', 'Juan Pablo', 'Fernanda', 'Emilio'];
const MEMBER_COLORS = {
  'Joaquín':    '#4DA6FF',
  'Esteban':    '#7C6AF7',
  'Juan Pablo': '#00D18C',
  'Fernanda':   '#FF6B9D',
  'Emilio':     '#FFB347',
};
const SPRINT_COLORS = {
  'Sprint 0': '#7C6AF7',
  'Sprint 1': '#4DA6FF',
  'Sprint 2': '#00D18C',
  'Sprint 3': '#FFB347',
  'Sprint 4': '#FF6B9D',
  'Sprint 5': '#FF5C5C',
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

function ChartShell({ title, subtitle, children, onExpand, meta }) {
  return (
    <article className="kpi-chart-card">
      <div className="kpi-chart-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
          {meta && <small>{meta}</small>}
        </div>
        {onExpand && (
          <button type="button" className="kpi-expand-button" onClick={onExpand}>
            Ver grande
          </button>
        )}
      </div>
      {children}
    </article>
  );
}

function KPIChartModal({ chart, onClose }) {
  if (!chart) return null;
  return (
    <div className="kpi-modal-backdrop" role="dialog" aria-modal="true">
      <section className="kpi-modal">
        <div className="kpi-modal-header">
          <div>
            <h2>{chart.title}</h2>
            {chart.subtitle && <p>{chart.subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar gráfica">×</button>
        </div>
        {chart.render(true)}
      </section>
    </div>
  );
}

// ─── Grouped bar chart ────────────────────────────────────────────────────────
function GroupedBarChart({ groups, series, colorMap, yLabel, yFormat, large = false }) {
  const allVals = groups.flatMap(g => series.map(s => g[s] || 0));
  const maxVal = Math.max(...allVals, 1);
  const chartH = large ? 360 : 240;
  const barW = large ? 30 : 24;
  const gap = large ? 8 : 5;
  const groupGap = large ? 34 : 26;
  const groupW = series.length * (barW + gap) - gap + groupGap;
  const totalW = Math.max(groups.length * groupW, large ? 860 : 620);

  function fmt(v) {
    if (yFormat === 'usd') return `$${Math.round(v).toLocaleString()}`;
    return v % 1 === 0 ? String(v) : v.toFixed(1);
  }

  return (
    <div className={`kpi-chart-body ${large ? 'large' : ''}`}>
      <div className="kpi-chart-legend">
        {series.map(s => (
          <span key={s}><i style={{ background: colorMap[s] || '#6b7280' }} />{s}</span>
        ))}
      </div>

      <div className="kpi-svg-scroll">
        <svg viewBox={`0 0 ${totalW + 70} ${chartH + 68}`} width="100%" height={chartH + 68} preserveAspectRatio="xMidYMid meet">
          {/* Y gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = 10 + chartH * (1 - pct);
            const val = maxVal * pct;
            return (
              <g key={pct}>
                <line x1={56} x2={totalW + 56} y1={y} y2={y} className="kpi-grid-line" />
                <text x={50} y={y + 4} textAnchor="end" className="kpi-axis-text">{fmt(val)}</text>
              </g>
            );
          })}

          {/* Y axis label */}
          <text transform={`translate(14, ${10 + chartH / 2}) rotate(-90)`} textAnchor="middle" className="kpi-axis-text">{yLabel}</text>

          {/* Bars */}
          {groups.map((group, gi) => {
            const gx = 64 + gi * groupW;
            return (
              <g key={gi}>
                {series.map((s, si) => {
                  const val = group[s] || 0;
                  const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
                  const x = gx + si * (barW + gap);
                  const y = 10 + chartH - barH;
                  return (
                    <g key={s}>
                      <rect x={x} y={y} width={barW} height={barH} fill={colorMap[s] || '#6b7280'} rx="5" opacity="0.95">
                        <title>{`${group.label} — ${s}: ${fmt(val)}`}</title>
                      </rect>
                      {val > 0 && barH > 14 && (
                        <text x={x + barW / 2} y={y + 13} textAnchor="middle" className="kpi-bar-label">{fmt(val)}</text>
                      )}
                    </g>
                  );
                })}
                {/* Group label */}
                <text
                  x={gx + (series.length * (barW + gap) - gap) / 2}
                  y={10 + chartH + 22}
                  textAnchor="middle" className="kpi-axis-text"
                >{group.label}</text>
              </g>
            );
          })}

          {/* X axis */}
          <line x1={56} x2={totalW + 56} y1={10 + chartH} y2={10 + chartH} stroke="var(--border-default)" />
        </svg>
      </div>
    </div>
  );
}

// ─── Line chart ───────────────────────────────────────────────────────────────
function LineChart({ sprints, series, colorMap, dashMap, yLabel, large = false }) {
  const allVals = series.flatMap(s => sprints.map(sp => s.data[sp] || 0));
  const maxVal = Math.max(...allVals, 1);
  const chartH = large ? 380 : 280;
  const chartW = large ? 980 : 820;
  const padL = 55, padR = 20, padT = 10, padB = 50;

  function xPos(i) {
    if (sprints.length === 1) return padL + chartW / 2;
    return padL + (i / (sprints.length - 1)) * (chartW - padL * 0.5);
  }
  function yPos(v) { return padT + chartH * (1 - v / maxVal); }

  return (
    <div className={`kpi-chart-body ${large ? 'large' : ''}`}>
      <div className="kpi-chart-legend">
        {series.map(s => (
          <span key={s.label}><i className="line" style={{ background: colorMap[s.label] || '#6b7280' }} />{s.label}</span>
        ))}
      </div>

      <div className="kpi-svg-scroll">
        <svg viewBox={`0 0 ${chartW + padL + padR} ${chartH + padT + padB}`} width="100%" height={chartH + padT + padB} preserveAspectRatio="xMidYMid meet">
          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padT + chartH * (1 - pct);
            return (
              <g key={pct}>
                <line x1={padL} x2={padL + chartW} y1={y} y2={y} className="kpi-grid-line" />
                <text x={padL - 6} y={y + 4} textAnchor="end" className="kpi-axis-text">{Math.round(maxVal * pct)}</text>
              </g>
            );
          })}

          {/* Y label */}
          <text transform={`translate(12, ${padT + chartH / 2}) rotate(-90)`} textAnchor="middle" className="kpi-axis-text">{yLabel}</text>

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
            <text key={sp} x={xPos(i)} y={padT + chartH + 24} textAnchor="middle" className="kpi-axis-text">{sp}</text>
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
  const [expandedChart, setExpandedChart] = useState(null);

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
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return { chart1Groups, chart2Series: chart2SeriesFiltered, chart3Groups, sprints, totalHrs, totalCost, completedTasks, completionRate };
  }, [tasks]);

  if (loading) return <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.75)' }}>Loading KPIs...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>Error: {error}</div>;

  const chartConfigs = [
    {
      id: 'completed',
      title: 'Tareas completadas por sprint',
      subtitle: 'Completadas agrupadas por developer y sprint.',
      meta: 'Dato: count de tareas con estado completada / done / cerrada.',
      render: (large = false) => (
        <GroupedBarChart
          groups={kpis.chart1Groups}
          series={TEAM_MEMBERS}
          colorMap={MEMBER_COLORS}
          yLabel="Tareas"
          large={large}
        />
      ),
    },
    {
      id: 'hours',
      title: 'Horas reales por desarrollador',
      subtitle: 'Tendencia de horas reales registradas por sprint.',
      meta: 'Dato: suma de horasReales por developer dentro de cada sprint.',
      render: (large = false) => (
        <LineChart
          sprints={kpis.sprints}
          series={kpis.chart2Series}
          colorMap={MEMBER_COLORS}
          dashMap={MEMBER_DASH}
          yLabel="Horas"
          large={large}
        />
      ),
    },
    {
      id: 'cost',
      title: 'Costo por desarrollador por sprint',
      subtitle: `Costo = horas reales × $${COST_PER_HOUR.toFixed(2)}/hr.`,
      meta: 'Tarifa calculada con $50,000 USD anuales entre 2,080 horas.',
      render: (large = false) => (
        <GroupedBarChart
          groups={kpis.chart3Groups}
          series={kpis.sprints}
          colorMap={SPRINT_COLORS}
          yLabel="USD"
          yFormat="usd"
          large={large}
        />
      ),
    },
  ];

  return (
    <section className="kpi-dashboard">
      <div className="kpi-hero">
        <div>
          <h2>KPI Dashboard</h2>
          <p>Horas, costo y avance del equipo con fórmulas visibles para revisión.</p>
        </div>
        <span>{kpis.sprints.length} sprints analizados</span>
      </div>

      <div className="kpi-formula-grid">
        <article className="kpi-stat-card">
          <span>Total tareas</span>
          <strong>{tasks.length}</strong>
          <small>Base de tareas cargadas</small>
        </article>
        <article className="kpi-stat-card">
          <span>Completadas</span>
          <strong>{kpis.completedTasks}</strong>
          <small>{kpis.completionRate}% de avance</small>
        </article>
        <article className="kpi-stat-card">
          <span>Horas reales</span>
          <strong>{Math.round(kpis.totalHrs)}h</strong>
          <small>Suma de horasReales</small>
        </article>
        <article className="kpi-stat-card">
          <span>Costo total</span>
          <strong>${Math.round(kpis.totalCost).toLocaleString()}</strong>
          <small>USD estimado</small>
        </article>
      </div>

      <article className="kpi-formula-card">
        <div>
          <span>Fórmula de costo</span>
          <strong>costo = horas reales × ${COST_PER_HOUR.toFixed(2)} USD/hr</strong>
        </div>
        <p>$50,000 USD/año ÷ 2,080 horas laborales = ${COST_PER_HOUR.toFixed(2)} USD/hr. El costo por sprint y developer se calcula con la suma de `horasReales`.</p>
      </article>

      <div className="kpi-chart-grid">
        {chartConfigs.map((chart) => (
          <ChartShell
            key={chart.id}
            title={chart.title}
            subtitle={chart.subtitle}
            meta={chart.meta}
            onExpand={() => setExpandedChart(chart)}
          >
            {chart.render(false)}
          </ChartShell>
        ))}
      </div>

      <KPIChartModal chart={expandedChart} onClose={() => setExpandedChart(null)} />
    </section>
  );
}

export default KPIDashboard;