"use client";

import { useEffect, useRef, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Bonjour, je suis Docteur Robot. Decrivez vos symptomes en quelques mots. (Ceci n'est pas un avis medical, appelez le 112/15 en cas d'urgence)",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: 'user', content: text } as Message];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply ?? "Je n'ai pas compris. Pouvez-vous reformuler ?";
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erreur reseau. Reessayez dans un instant.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="brand">?? Docteur Robot</div>
        <div className="subtitle">Assistant de triage ? non substitut a un medecin</div>
      </header>

      <main className="chat" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div className="avatar">{m.role === 'assistant' ? '??' : '??'}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
      </main>

      <form className="composer" onSubmit={sendMessage}>
        <input
          aria-label="Votre message"
          placeholder={loading ? 'Patientez...' : 'Decrivez vos symptomes...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? '...' : 'Envoyer'}
        </button>
      </form>

      <footer className="footer">
        En cas d'urgence: appelez le <strong>112/15</strong> immediatement.
      </footer>

      <style jsx>{`
        .page {
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          background: #0b1020;
          color: #e9ecf1;
        }
        .header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
        }
        .brand { font-weight: 700; font-size: 18px; }
        .subtitle { opacity: 0.8; font-size: 12px; }
        .chat {
          overflow: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bubble {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 10px;
          align-items: start;
        }
        .bubble .avatar { font-size: 20px; line-height: 28px; }
        .bubble .content {
          background: rgba(255,255,255,0.06);
          padding: 12px 14px;
          border-radius: 12px;
          white-space: pre-wrap;
        }
        .bubble.user .content { background: rgba(80,160,255,0.15); }
        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: #0a0f1c;
        }
        .composer input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 12px 14px;
          color: #e9ecf1;
          outline: none;
        }
        .composer input:disabled { opacity: 0.6; }
        .composer button {
          background: #4f8cff;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .composer button:disabled { opacity: 0.5; cursor: default; }
        .footer {
          text-align: center;
          font-size: 12px;
          opacity: 0.7;
          padding-bottom: 10px;
        }
        @media (max-width: 640px) {
          .chat { padding-bottom: 12px; }
          .composer { position: sticky; bottom: 0; }
        }
      `}</style>
    </div>
  );
}
