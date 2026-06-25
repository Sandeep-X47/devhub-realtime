// Map a file extension to a Monaco language id.
const EXT_LANG = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp', go: 'go',
  rs: 'rust', rb: 'ruby', php: 'php', html: 'html', css: 'css', scss: 'scss',
  json: 'json', md: 'markdown', sql: 'sql', sh: 'shell', yml: 'yaml',
  yaml: 'yaml', xml: 'xml', kt: 'kotlin', swift: 'swift', dart: 'dart',
};

export function languageForFile(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  return EXT_LANG[ext] || 'plaintext';
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function timeAgo(date) {
  const d = new Date(date);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function clockTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
