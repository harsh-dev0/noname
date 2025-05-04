import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Check environment variables
  const envVars = {
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV,
  };
  
  return NextResponse.json(envVars);
}
