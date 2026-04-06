import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { summary } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a food researcher. Based on this filtered dataset summary, write 3 concise insight bullets (1-2 sentences each). Focus on surprising patterns, cross-market differences, or demographic trends. Be specific with numbers.\n\nData:\n${summary}`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || 'No insights generated.';
  return NextResponse.json({ insights: text });
}
