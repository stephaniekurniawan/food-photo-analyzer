import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { imageUrl } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: 'No imageUrl' }, { status: 400 });
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: `Analyze this food photo and return JSON only (no markdown):
{"nutrition":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"sugar":0,"salt":0,"potassium":0},"colors":["#hex1","#hex2","#hex3","#hex4","#hex5"],"plateCount":1,"estimatedPeople":1,"cuisineType":"Traditional Local","healthScore":7,"description":"Brief description","ingredients":["item1","item2"]}` }
        ]
      }]
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
