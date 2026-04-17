import React, { useState, useEffect } from 'react';

const TEAM_MEMBERS = ['Joaquín', 'Esteban', 'Juan Pablo', 'Fernanda', 'Emilio'];

const MEMBER_COLORS = {
  'Joaquín': '#8b5cf6',
  'Esteban': '#3b82f6',
  'Juan Pablo': '#10b981',
  'Fernanda': '#f59e0b',
  'Emilio': '#ef4444',
};

const STORAGE_KEY = 'coqui_team_channel';

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function TeamChannel() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [author, setAuthor] = useState(TEAM_MEMBERS[0]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = {
      id: `${Date.now()}-${Math.random()}`,
      author,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setText('');
  }

  function handleDelete(id) {
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  return (
    <section style={{
      background: 'var(--surface-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      marginTop: '1.5rem',
    }}>
      <h3 style={{
        margin: '0 0 1rem', fontSize: '0.75rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)'
      }}>
        💬 Team Channel
      </h3>

      {/* Messages */}
      <div style={{
        maxHeight: '320px', overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '10px', marginBottom: '1rem',
        paddingRight: '4px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-placeholder)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            padding: '10px 12px', background: 'var(--bg-raised-2)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            position: 'relative', group: 'true'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: MEMBER_COLORS[msg.author] || '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, color: '#fff'
            }}>
              {getInitials(msg.author)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: MEMBER_COLORS[msg.author] || 'var(--text-primary)' }}>
                  {msg.author}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-placeholder)' }}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {msg.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(msg.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-placeholder)', fontSize: '0.75rem', padding: '2px 4px',
                flexShrink: 0, opacity: 0.6
              }}
              title="Delete message"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <select
          value={author}
          onChange={e => setAuthor(e.target.value)}
          style={{
            padding: '8px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', background: 'var(--bg-raised-2)',
            color: MEMBER_COLORS[author] || 'var(--text-primary)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0
          }}
        >
          {TEAM_MEMBERS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a message to the team..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', background: 'var(--bg-raised-2)',
            color: 'var(--text-primary)', fontSize: '0.85rem',
          }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            padding: '8px 18px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--color-success)',
            color: '#fff', cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
            opacity: text.trim() ? 1 : 0.5
          }}
        >
          Send
        </button>
      </form>
    </section>
  );
}

export default TeamChannel;