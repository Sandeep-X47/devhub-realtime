/**
 * AI assistant service — talks to Llama models through Groq's OpenAI-compatible
 * endpoint. Groq's free tier comfortably covers hackathon-scale traffic.
 *
 * Design choice: the API key lives ONLY on the server. The frontend never sees
 * it. Every AI call is proxied through our backend so we can (a) keep the secret
 * safe, (b) inject the relevant code file as context, and (c) log the exchange
 * into the workspace's AI channel for the whole team to see.
 */

const SYSTEM_PROMPT = `You are DevHub AI, a concise senior engineer embedded in a student hackathon team's workspace.
Rules:
- Answer the actual question. No filler, no "as an AI" preamble.
- When given a code file as context, reason about THAT code specifically.
- Prefer short, correct, runnable snippets over long essays.
- If the code has a bug, name the line/cause directly.
- Use Markdown. Use fenced code blocks with a language tag.`;

export async function askAI({ question, codeContext, history = [] }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      text:
        '⚠️ AI is not configured. Add a free `GROQ_API_KEY` from https://console.groq.com/keys to the backend `.env` to enable the assistant.',
    };
  }

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (codeContext?.content) {
    messages.push({
      role: 'system',
      content: `The user is currently looking at a file named "${codeContext.name}" (${codeContext.language}). Here is its full content:\n\n\`\`\`${codeContext.language}\n${codeContext.content}\n\`\`\``,
    });
  }

  // Last few turns of the AI thread for continuity, trimmed to stay light.
  for (const m of history.slice(-8)) {
    messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text });
  }

  messages.push({ role: 'user', content: question });

  const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Groq error:', res.status, detail);
      return { ok: false, text: `AI provider error (${res.status}). Try again in a moment.` };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    return { ok: true, text };
  } catch (err) {
    console.error('AI request failed:', err.message);
    return { ok: false, text: 'Could not reach the AI provider. Check the server network.' };
  }
}
