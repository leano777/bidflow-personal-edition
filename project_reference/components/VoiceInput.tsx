import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  append?: boolean; // Whether to append to existing text or replace
  className?: string;
}

export function VoiceInput({ onTranscript, placeholder = "Click to start voice input", append = false, className = "" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
      
      // Create recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('Voice input started - speak now');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        switch (event.error) {
          case 'network':
            toast.error('Network error during voice input');
            break;
          case 'not-allowed':
            toast.error('Microphone permission denied');
            break;
          case 'no-speech':
            toast.warning('No speech detected');
            break;
          default:
            toast.error('Voice input error: ' + event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        if (!append) {
          setTranscript('');
        }
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice input:', error);
        toast.error('Failed to start voice input');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        className="flex items-center gap-2"
        title={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice</span>
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline">Listening...</span>
        </div>
      )}
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}