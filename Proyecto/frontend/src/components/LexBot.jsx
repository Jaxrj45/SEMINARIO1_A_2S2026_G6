import { useState, useRef, useEffect } from 'react';
import { sendLexMessage } from '../services/lex';
import {
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CpuChipIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function LexBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hola, soy el asistente virtual de la Facultad de Ingeniería USAC impulsado por Amazon Lex V2. ¿En qué puedo orientarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const botReply = await sendLexMessage(text);
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Error enviando mensaje a Lex:', err);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Lo siento, no pude procesar la consulta en este momento.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Horario de biblioteca',
    '¿Dónde queda la facultad?',
    'Teléfono y contacto',
    '¿Cómo me asigno cursos?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Botón flotante de Lex */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-full shadow-xl shadow-indigo-600/30 transition-all duration-200 transform hover:scale-105 cursor-pointer border border-indigo-400/30"
          title="Consultar al Bot de la Facultad (Amazon Lex)"
        >
          <CpuChipIcon className="w-5 h-5 text-indigo-200" />
          <span className="font-semibold text-xs tracking-wide">Asistente Lex</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Ventana de chat con Lex */}
      {isOpen && (
        <div className="bg-zinc-900 border border-zinc-800 w-96 max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <CpuChipIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-100">Asistente Académico</h4>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Amazon Lex V2
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/90 px-3.5 py-2 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-xs text-zinc-400 border border-zinc-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias rápidas */}
          <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800/80 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Consulta horarios, trámites o ubicación..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
