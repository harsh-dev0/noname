import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { getEnv } from '@/lib/env';

export async function POST(req: NextRequest) {
  // Debug environment variables
  console.log('API route debug info:');
  console.log(`- OpenAI API Key exists: ${Boolean(getEnv.openaiApiKey)}`);
  console.log(`- OpenAI API Key length: ${getEnv.openaiApiKey.length}`);
  console.log(`- NODE_ENV: ${getEnv.nodeEnv}`);
  
  // If API key is missing, return an error immediately
  if (!getEnv.isConfigValid()) {
    return NextResponse.json(
      { error: 'OpenAI API key is missing or invalid. Please check your .env.local file.' },
      { status: 500 }
    );
  }

  try {
    console.log('API route: Receiving transcription request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('API route: No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`API route: File received, size: ${file.size} bytes, type: ${file.type}`);
    
    const text = await transcribeAudio(file);
    console.log('API route: Transcription successful');
    return NextResponse.json({ text });
  } catch (error) {
    console.error('API route: Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
