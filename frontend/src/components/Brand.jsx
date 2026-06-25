import { initials } from '../lib/utils.js';

// The DevHub mark: two nodes joined by a signal — the "hub" idea, literally.
export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="dh-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d="M9 9 L9 23 M9 9 L20 9 Q25 9 25 14 Q25 19 20 19 L9 19 M16 19 L25 23"
        stroke="url(#dh-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.4" fill="#22d3ee" />
      <circle cx="25" cy="23" r="2.4" fill="#a78bfa" />
    </svg>
  );
}

export function Wordmark({ size = 28 }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <Logo size={size} />
      <span className="font-display font-700 text-lg tracking-tight">
        Dev<span className="gradient-text">Hub</span>
      </span>
    </div>
  );
}

export function Avatar({ name, color = '#22d3ee', size = 30, ring = false }) {
  return (
    <div
      className={`grid place-items-center rounded-full font-display font-600 text-void shrink-0 ${
        ring ? 'ring-2 ring-void' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
