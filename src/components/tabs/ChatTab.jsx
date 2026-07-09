import ReactMarkdown from 'react-markdown';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { askQuestion } from '../../api/assistant';

const buildInitialMessages = (authSession) => [
  {
    id: 'welcome',
    role: 'assistant',
    content: `Hola${authSession?.name ? `, ${authSession.name}` : ''}. Soy SARA. Pregúntame sobre reglamentos, procesos o financiamiento.`,
    fragmentsUsed: null,
    fragments: [],
    model: null,
  },
];

const generateFallbackUUID = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

function Avatar({ role, name }) {
  if (role === 'assistant') {
    return (
      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-brand-yellow text-xs font-bold text-ink-950">
        S
      </div>
    );
  }
  const initials = (name ?? 'TU').slice(0, 2).toUpperCase();
  return (
    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-brand-blue text-xs font-bold text-white">
      {initials}
    </div>
  );
}

export function ChatTab({ authSession }) {
  const initialMessages = useMemo(() => buildInitialMessages(authSession), [authSession]);
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sesionId, setSesionId] = useState(null);
  const [runningRequestCtrl, setRunningRequestCtrl] = useState(null);
  const scrollContainerRef = useRef(null);

  const handleNewChat = useCallback(() => {
    runningRequestCtrl?.abort();
    setRunningRequestCtrl(null);
    setSesionId(null);
    setMessages(buildInitialMessages(authSession));
  }, [authSession, runningRequestCtrl]);

  useEffect(() => {
    setMessages(buildInitialMessages(authSession));
    return () => {
      runningRequestCtrl?.abort();
    };
  }, [authSession]);

  // Auto-scroll al fondo cada vez que cambian los mensajes (nuevo mensaje, respuesta, o loading)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

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
    if (!trimmedMessage || isLoading) {
      return;
    }

    setError('');
    setIsLoading(true);
    const ctrl = new AbortController();
    setRunningRequestCtrl(ctrl);

    const userMessage = {
      id: generateFallbackUUID(),
      role: 'user',
      content: trimmedMessage,
    };
    const loadingMessage = {
      id: generateFallbackUUID(),
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
          id: generateFallbackUUID(),
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
        const errorMessage = requestError?.response?.data?.detail ?? 'No se pudo conectar con el backend. Inténtalo de nuevo más tarde.';
        setError(errorMessage);
        setMessages((currentMessages) => currentMessages.filter((msg) => msg.id !== loadingMessage.id));
      }
    } finally {
      setIsLoading(false);
      setRunningRequestCtrl(null);
    }
  };

  const isSendDisabled = isLoading || message.trim().length === 0;

  return (
    <section className="flex h-[calc(100vh-14rem)] min-h-[520px] flex-col gap-4">
      {/* Encabezado — altura fija, no crece */}
      <div className="flex flex-shrink-0 flex-col gap-3 rounded-lg bg-ink-800 px-5 py-4 shadow-md shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand-yellow">Chat RAG</p>
          <h2 className="m-0 text-lg font-semibold text-white">Consulta el reglamento con contexto real</h2>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={isLoading}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-ink-700 px-3.5 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-ink-600 disabled:opacity-50"
        >
          + Nueva conversación
        </button>
      </div>

      {/* Historial de mensajes — ocupa todo el espacio restante, scroll interno */}
      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-lg bg-ink-800 p-5 shadow-md shadow-black/20"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <Avatar role={msg.role} name={authSession?.name} />

              <div className={`flex min-w-0 flex-1 flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`mb-1.5 flex items-baseline gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-semibold text-white">
                    {msg.role === 'assistant' ? 'SARA' : authSession?.name ?? 'Tú'}
                  </span>
                  {msg.role === 'assistant' && msg.model ? (
                    <span className="text-[11px] text-gray-400">{msg.model}</span>
                  ) : null}
                </div>

                {msg.is_loading ? (
                  <div className="flex w-fit items-center gap-1.5 rounded-md bg-ink-700 px-3 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                  </div>
                ) : (
                  <div
                    className={`w-fit max-w-full rounded-md px-3.5 py-3 text-[0.95rem] leading-6 text-gray-100 sm:max-w-[min(85%,640px)] ${
                      isUser
                        ? 'border border-brand-blue/50 bg-brand-blue/20'
                        : 'bg-ink-700'
                    } space-y-3 [&_p]:m-0 [&_p]:leading-6 [&_strong]:font-semibold [&_strong]:text-white [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_li]:leading-6`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compositor — altura fija, siempre visible al fondo */}
      <div className="flex-shrink-0 rounded-lg bg-ink-800 p-3 shadow-md shadow-black/20">
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full resize-none rounded-md bg-ink-700 px-3.5 py-3 text-sm text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-50"
            rows="3"
            placeholder="Escribe tu consulta sobre reglamentos, procesos o financiamiento..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !isSendDisabled) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            disabled={isLoading}
          />

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500">
              Enter para enviar · Shift + Enter para salto de línea
            </span>
            {isLoading ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25"
                onClick={handleCancel}
              >
                ■ Cancelar
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-gray-500"
                disabled={isSendDisabled}
              >
                Enviar
              </button>
            )}
          </div>

          {error ? (
            <p className="mt-3 rounded-md bg-red-950/40 p-3 text-sm text-red-300">{error}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}