import ReactMarkdown from 'react-markdown';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { askQuestion } from '../../api/assistant';
import { api } from '../../api/client';

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
  const [sesionId, setSesionId] = useState(null);
  const [runningRequestCtrl, setRunningRequestCtrl] = useState(null);

  useEffect(() => {
    setMessages(buildInitialMessages(authSession));
    return () => {
      runningRequestCtrl?.abort();
    };
  }, [authSession]);

  const handleNewChat = () => {
    runningRequestCtrl?.abort();
    setRunningRequestCtrl(null);
    setSesionId(null);
    setMessages(buildInitialMessages(authSession));
  };

  const handleCancel = () => {
    if (!runningRequestCtrl) {
      return;
    }
    runningRequestCtrl.abort();
    setRunningRequestCtrl(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    const ctrl = new AbortController();
    setRunningRequestCtrl(ctrl);

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
    };
    const loadingMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      is_loading: true,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, loadingMessage]);
    setMessage('');

    try {
      const data = await askQuestion({ question: trimmedMessage, sesion_id: sesionId, signal: ctrl.signal });
      if (ctrl.signal.aborted) {
        return;
      }

      if (data.sesion_id) {
        setSesionId(data.sesion_id);
      }

      setMessages((currentMessages) => [
        ...currentMessages.filter((msg) => msg.id !== loadingMessage.id),
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
      if (ctrl.signal.aborted || axios.isCancel(requestError)) {
        setMessages((currentMessages) =>
          currentMessages.filter((msg) => msg.id !== userMessage.id && msg.id !== loadingMessage.id),
        );
      } else {
        setError(requestError?.response?.data?.detail ?? 'No se pudo consultar el backend.');
        setMessages((currentMessages) => currentMessages.filter((msg) => msg.id !== loadingMessage.id));
      }
    } finally {
      setIsSubmitting(false);
      setRunningRequestCtrl(null);
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
              <article key={message.id} className={`chat-bubble ${message.role} ${message.is_loading ? 'is-loading' : ''}`}>
                {message.is_loading ? <div className="spinner" /> : <div className="chat-message-content"><ReactMarkdown>{message.content}</ReactMarkdown></div>}
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event);
                  }
                }}
                disabled={isSubmitting}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="secondary-button" onClick={handleNewChat} disabled={isSubmitting}>
                Nueva Conversación
              </button>
              {isSubmitting ? (
                <button type="button" className="primary-button" onClick={handleCancel}>
                  ■
                </button>
              ) : (
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  Enviar pregunta
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}