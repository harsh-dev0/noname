'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [alerted, setAlerted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const recorderRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRecording && timeLeft === 0) {
      stopRecording();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  const startRecording = async () => {
    try {
      setTranscript('');
      setAlerted(false);
      setIsRecording(true);
      setTimeLeft(5);
      setIsLoading(false);
      
      const { default: MicRecorder } = await import('mic-recorder-to-mp3');
      const recorder = new MicRecorder({ bitRate: 128 });
      recorderRef.current = recorder;

      await recorder.start();
      console.log('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setTranscript('Error accessing microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    
    try {
      setIsRecording(false);
      setIsLoading(true);
      setTimeLeft(0);
      
      console.log('Recording stopped, processing...');
      const recorder = recorderRef.current;
      const [buffer, blob] = await recorder.stop().getMp3();
      const file = new File(buffer, 'recording.mp3', { type: blob.type });

      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending audio for transcription...');
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Transcription API error:', res.status, errorData);
        setTranscript('Error transcribing audio. Please try again.');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      
      if (!data || !data.text) {
        console.error('Invalid response format:', data);
        setTranscript('Received invalid response from transcription service.');
        setIsLoading(false);
        return;
      }

      setTranscript(data.text);
      setIsLoading(false);

      if (data.text.toLowerCase().includes('help')) {
        console.log('🚨 ALERT TRIGGERED');
        setAlerted(true);
      }
    } catch (error) {
      console.error('Error in recording/transcription:', error);
      setTranscript('Error processing audio. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Voice Alert MVP</h1>
        
        <div className="flex flex-col items-center justify-center mb-8">
          {isRecording ? (
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                <div className="relative flex items-center justify-center w-32 h-32 bg-red-500 rounded-full">
                  <span className="text-white text-4xl font-bold">{timeLeft}</span>
                </div>
              </div>
              <p className="text-gray-700 mb-4 text-center">Recording your voice...</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Processing your audio...</p>
            </div>
          ) : (
            <button 
              onClick={startRecording} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg shadow-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Record 5s
            </button>
          )}
        </div>
        
        {transcript && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h2 className="font-semibold text-gray-700 mb-2">Transcript:</h2>
            <p className="text-gray-800">{transcript}</p>
          </div>
        )}
        
        {alerted && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-pulse">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-red-700 font-bold">ALERT TRIGGERED</span>
            </div>
            <p className="text-red-600 mt-2">Help keyword detected in audio!</p>
          </div>
        )}
      </div>
    </main>
  );
}
