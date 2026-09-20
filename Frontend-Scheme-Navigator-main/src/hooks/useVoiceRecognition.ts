import { useState, useEffect, useRef, useCallback } from 'react';

// Declaration for Web Speech API SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (finalTranscript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = (options: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState(options.language || 'en-IN');
  const [isSupported, setIsSupported] = useState(() => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onResultRef.current = options.onResult;
    onErrorRef.current = options.onError;
  });

  useEffect(() => {
    if (options.language && options.language !== language) {
      setLanguageState(options.language);
    }
  }, [options.language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop error:', err);
      }
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      const errMsg = 'Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.debug('Abort previous recognition:', e);
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = options.continuous !== false;
      recognition.interimResults = options.interimResults !== false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript + ' ';
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + currentFinal).trim();
            onResultRef.current?.(updated, true);
            return updated;
          });
        }

        setInterimTranscript(currentInterim);
        if (currentInterim) {
          onResultRef.current?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error event:', event.error);
        if (event.error === 'no-speech') {
          // Ignore harmless no-speech timeout
          return;
        }
        let userError = 'Voice input failed. Please check microphone permissions and try again.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userError = 'Microphone permission denied. Please allow microphone access in your browser.';
        } else if (event.error === 'network') {
          userError = 'Network error occurred during voice recognition.';
        }
        setError(userError);
        setIsListening(false);
        onErrorRef.current?.(userError);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize SpeechRecognition:', err);
      setError('Could not start voice recognition: ' + (err.message || 'Unknown error'));
      setIsListening(false);
    }
  }, [language, options.continuous, options.interimResults]);

  const setLanguage = useCallback((newLang: string) => {
    setLanguageState(newLang);
    if (isListening && recognitionRef.current) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.debug('Recognition cleanup error:', e);
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    language,
    setLanguage,
    startListening,
    stopListening,
    resetTranscript,
  };
};
