import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar } from './Brand.jsx';
import { clockTime } from '../lib/utils.js';

function Message({ m }) {
  const isAI = m.role === 'assistant';
  return (
    <div className="flex gap-2.5 px-3 py-2 animate-fade-up">
      <Avatar name={m.authorName} color={m.avatarColor || (isAI ? '#a78bfa' : '#22d3ee')} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-600 ${isAI ? 'gradient-text' : 'text-text'}`}>
            {m.authorName}
          </span>
          <span className="text-[11px] text-muted-2">{clockTime(m.createdAt)}</span>
        </div>
        {isAI ? (
          <div className="md text-sm text-text/90 mt-0.5">
            <ReactMarkdown>{m.text}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-text/90 mt-0.5 whitespace-pre-wrap break-words">{m.text}</p>
        )}
      </div>
    </div>
  );
}

export default function CommsPanel({
  channel, // 'team' | 'ai'
  setChannel,
  teamMessages,
  aiMessages,
  aiThinking,
  typingName,
  activeFile,
  onSendChat,
  onAskAI,
}) {
  const [text, setText] = useState('');
  const [withContext, setWithContext] = useState(true);
  const scrollRef = useRef(null);
  const messages = channel === 'team' ? teamMessages : aiMessages;

  // Stick to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, aiThinking, channel]);

  function send() {
    const t = text.trim();
    if (!t) return;
    if (channel === 'team') onSendChat(t);
    else onAskAI(t, withContext && activeFile ? activeFile._id : null);
    setText('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 h-10 border-b border-border shrink-0">
        <button
          className={`tab ${channel === 'team' ? 'tab-active' : ''}`}
          onClick={() => setChannel('team')}
        >
          Team chat
          {channel === 'team' && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-cyan rounded-full" />}
        </button>
        <button
          className={`tab ${channel === 'ai' ? 'tab-active' : ''}`}
          onClick={() => setChannel('ai')}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet" />
            AI assistant
          </span>
          {channel === 'ai' && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-violet rounded-full" />}
        </button>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
        {messages.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted">
              {channel === 'team'
                ? 'No messages yet. Say hi to your team.'
                : 'Ask DevHub AI anything about your code, a bug, or an approach.'}
            </p>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} m={m} />
        ))}
        {channel === 'ai' && aiThinking && (
          <div className="px-3 py-2 flex items-center gap-2 text-sm text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-violet animate-pulse-signal" />
            DevHub AI is thinking…
          </div>
        )}
        {channel === 'team' && typingName && (
          <div className="px-4 py-1 text-xs text-muted-2 italic">{typingName} is typing…</div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-2.5 shrink-0">
        {channel === 'ai' && activeFile && (
          <label className="flex items-center gap-2 mb-2 text-xs text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withContext}
              onChange={(e) => setWithContext(e.target.checked)}
              className="accent-violet"
            />
            Include <span className="font-mono text-violet">{activeFile.name}</span> as context
          </label>
        )}
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={channel === 'team' ? 'Message your team…' : 'Ask about your code…'}
            className="input resize-none max-h-32 py-2"
          />
          <button
            onClick={send}
            disabled={!text.trim() || (channel === 'ai' && aiThinking)}
            className={`btn shrink-0 ${channel === 'ai' ? 'bg-violet text-void' : 'bg-cyan text-void'} font-semibold hover:opacity-90`}
          >
            {channel === 'ai' ? 'Ask' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
