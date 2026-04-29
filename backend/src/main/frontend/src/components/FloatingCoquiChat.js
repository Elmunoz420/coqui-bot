import React, { useState } from 'react';
import AISuggestionCard from './AISuggestionCard';
import coquiChatFrog from '../assets/coqui-bot-floating-transparent.png';

function FloatingCoquiChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="floating-coqui-chat">
      {open && (
        <section className="floating-coqui-panel" aria-label="Chat con Coqui">
          <div className="floating-coqui-panel-header">
            <div>
              <strong>Coqui Bot</strong>
              <span>Consulta tareas, prioridades y carga del equipo.</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat">×</button>
          </div>
          <AISuggestionCard embedded />
        </section>
      )}

      <button
        type="button"
        className="floating-coqui-button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar chat de Coqui' : 'Abrir chat de Coqui'}
      >
        <img src={coquiChatFrog} alt="" />
      </button>
    </div>
  );
}

export default FloatingCoquiChat;
