import React, { useState, useRef, useEffect } from 'react';

function AISuggestionCard() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy Coqui 🐸, tu asistente del equipo. Puedo responder preguntas sobre tareas, carga de trabajo y darte recomendaciones. ¿En qué te ayudo?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || data.error || 'Sin respuesta' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error al conectar con la IA.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', fontWeight: 600, fontSize: '14px', background: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🐸</span> Coqui — Asistente del equipo
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#2563eb' : '#f1f5f9',
              color: msg.role === 'user' ? '#fff' : '#1e293b',
              fontSize: '13px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 12px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontSize: '13px' }}>
              Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pregunta sobre el equipo o las tareas..."
          disabled={loading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '13px', outline: 'none' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default AISuggestionCard;
