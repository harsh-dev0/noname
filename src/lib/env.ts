// Helper to safely access environment variables
export const getEnv = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Add a validation function to check if required env vars are set
  isConfigValid: (): boolean => {
    const requiredVars = [
      { name: 'OPENAI_API_KEY', value: getEnv.openaiApiKey }
    ];
    
    const missingVars = requiredVars
      .filter(v => !v.value || v.value.length < 10)
      .map(v => v.name);
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    return true;
  }
};
