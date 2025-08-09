import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message } = await req.json();
    // Here you would call OpenAI or any AI service
    const cleanedMessage = message.trim(); // Placeholder cleaning
    return NextResponse.json({ cleaned: cleanedMessage });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
