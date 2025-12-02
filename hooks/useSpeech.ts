
import { useState, useEffect, useCallback } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [recognition, setRecognition] = useState<any>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
                setError(null);
            };
            rec.onend = () => setIsListening(false);
            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
            };
            rec.onerror = (e: any) => {
                console.warn("Speech recognition error", e);
                setIsListening(false);
                if (e.error === 'not-allowed') setError("Microphone access denied.");
                else if (e.error === 'no-speech') setError("No speech detected.");
                else setError("Voice recognition failed.");
            };

            setRecognition(rec);
            setIsSupported(true);
        } else {
            setIsSupported(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition) {
            setTranscript(""); 
            setError(null);
            try {
                recognition.start();
            } catch (e) {
                // Ignore if already started
            }
        } else if (!isSupported) {
            setError("Voice input not supported in this browser.");
        }
    }, [recognition, isSupported]);

    const stopListening = useCallback(() => {
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore stop errors
            }
        }
    }, [recognition]);

    return { isListening, transcript, startListening, stopListening, isSupported, error };
};
