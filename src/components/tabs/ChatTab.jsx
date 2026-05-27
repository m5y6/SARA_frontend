import { useEffect, useMemo, useState } from 'react';
import { askQuestion } from '../../api/assistant';

function buildInitialMessages(authSession) {
  return [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hola${authSession?.name ? `, ${authSession.name}` : ''}. Soy SARA. Pregúntame sobre reglamentos, procesos o financiamiento.`,
      fragmentsUsed: null,
      fragments: [],
      model: null,
    },
  ];
}

export function ChatTab({ authSession }) {
  const initialMessages = useMemo(() => buildInitialMessages(authSession), [authSession]);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessages(buildInitialMessages(authSession));
  }, [authSession]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessage('');

    try {
      const data = await askQuestion({ question: trimmedMessage });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          fragmentsUsed: data.fragments_used,
          fragments: data.fragments ?? [],
          model: data.model,
        },
      ]);
    } catch (requestError) {
      setError(requestError?.response?.data?.detail ?? 'No se pudo consultar el backend.');
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel-card panel-chat">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Chat RAG</p>
          <h2>Consulta el reglamento con contexto real</h2>
        </div>
        <div className="status-pill">{authSession ? 'Autenticado' : 'Modo público'}</div>
      </header>

      <div className="chat-layout">
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((message) => (
              <article key={message.id} className={`chat-bubble ${message.role}`}>
                <p>{message.content}</p>
                {message.role === 'assistant' && message.fragments?.length > 0 ? (
                  <div className="chat-source-list">
                    <span className="chat-meta">
                      {message.fragmentsUsed ?? message.fragments.length} fragmentos usados{message.model ? ` • ${message.model}` : ''}
                    </span>
                    {message.fragments.map((fragment) => (
                      <div key={fragment.id} className="chat-source-item">
                        <strong>{fragment.metadata?.titulo ?? 'Fragmento'}</strong>
                        <span>{fragment.contenido}</span>
                        <small>Similarity {fragment.similarity}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <label className="chat-input-label">
              Escribe tu mensaje
              <textarea
                rows="4"
                placeholder="Escribe aquí tu consulta..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Consultando...' : 'Enviar pregunta'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}