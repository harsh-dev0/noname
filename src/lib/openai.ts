import { getEnv } from './env';

export async function transcribeAudio(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided");
  }

  console.log(`OpenAI lib: Processing file of size ${file.size} bytes and type ${file.type}`);
  
  if (!getEnv.isConfigValid()) {
    throw new Error("OpenAI API key is not configured correctly. Please check your .env.local file.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    console.log("OpenAI lib: Sending request to OpenAI API");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnv.openaiApiKey}`,
      },
      body: formData,
    });

    console.log(`OpenAI lib: Received response with status ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`OpenAI lib: API error (${response.status}):`, errorText);
      throw new Error(`Transcription failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI lib: Successfully parsed response JSON");
    
    if (!data || !data.text) {
      console.error("OpenAI lib: Invalid response from OpenAI:", data);
      throw new Error("Invalid response from transcription service");
    }
    
    return data.text;
  } catch (error) {
    console.error("OpenAI lib: Error during transcription:", error);
    throw error;
  }
}