import React, { useState, useRef, useEffect } from 'react';
import CoquiIcon from './CoquiIcon';

function AISuggestionCard({ embedded = false }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy Coqui, tu asistente del equipo. Puedo responder preguntas sobre tareas, carga de trabajo y darte recomendaciones. ¿En qué te ayudo?' }
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
    <div className={`ai-chat-card ${embedded ? 'embedded' : ''}`}>
      <div className="ai-chat-header">
        <CoquiIcon className="ai-chat-header-icon" /> Coqui — Asistente del equipo
      </div>

      <div className="ai-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-row ${msg.role}`}>
            <div className="ai-chat-bubble">
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-chat-row assistant">
            <div className="ai-chat-bubble muted">
              Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-chat-composer">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pregunta sobre el equipo o las tareas..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default AISuggestionCard;
