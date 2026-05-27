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
  const [question, setQuestion] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessages(buildInitialMessages(authSession));
  }, [authSession]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion('');

    try {
      const data = await askQuestion({
        question: trimmedQuestion,
        temperature,
        sesionId: sessionId,
      });

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
            <div className="field-row">
              <label>
                Sesión opcional
                <input
                  type="number"
                  placeholder="12"
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                />
              </label>
              <label>
                Temperature
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                />
                <span className="range-value">{temperature.toFixed(1)}</span>
              </label>
            </div>

            <label className="chat-input-label">
              Pregunta
              <textarea
                rows="3"
                placeholder="¿Cuál es el horario de atención?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
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