import { useState, useRef, useCallback, useEffect } from 'react';
import { Status, Message } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';

// Type definitions for the Web Speech API, which are not standard in all TS lib files.
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

type SpeechRecognitionErrorCode = 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

const SpeechRecognition: SpeechRecognitionStatic | undefined = 
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const API_KEY_LOCAL_STORAGE_KEY = 'google_api_key';

const getApiKey = (): string => {
    try {
        const storedKey = localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY);
        return storedKey || process.env.API_KEY || "";
    } catch (e) {
        return process.env.API_KEY || "";
    }
}

export const useVoiceAssistant = () => {
    const [status, setStatus] = useState<Status>(Status.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<Message[]>([]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    
    const chatRef = useRef<Chat | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isMounted = useRef(true);

    const isSessionActiveRef = useRef(isSessionActive);
    useEffect(() => {
        isSessionActiveRef.current = isSessionActive;
    }, [isSessionActive]);

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false;
            // Ensure session is stopped on unmount
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || !isMounted.current) return;
        try {
            recognitionRef.current.start();
            setStatus(Status.LISTENING);
        } catch (e) {
            // It might throw an error if it's already started, which is fine.
            console.warn("Speech recognition could not start.", e);
        }
    }, []);

    const speakResponse = useCallback((text: string) => {
        if (!isMounted.current) return;
        setStatus(Status.SPEAKING);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG'; // Set language to Egyptian Arabic
        utterance.rate = 1.1;
        utteranceRef.current = utterance;

        utterance.onend = () => {
            if (isMounted.current && isSessionActiveRef.current) {
                startListening();
            } else {
                if(isMounted.current) setStatus(Status.IDLE);
            }
        };

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            console.error('SpeechSynthesis Error:', event);
            if (isMounted.current) {
                setError('حدث خطأ أثناء تشغيل الصوت.');
                setStatus(Status.ERROR);
            }
        };

        window.speechSynthesis.speak(utterance);
    }, [startListening]);


    const processTranscript = useCallback(async (text: string) => {
        if (!chatRef.current) {
            const errorMessage = "لم تبدأ جلسة المحادثة. الرجاء التحقق من مفتاح API.";
             if (isMounted.current) {
                setError(errorMessage);
                setStatus(Status.ERROR);
                speakResponse(errorMessage);
            }
            return;
        };
        setStatus(Status.THINKING);
        try {
            const response = await chatRef.current.sendMessage({ message: text });
            if (isMounted.current) {
                const aiResponse = response.text;
                setTranscript(prev => [...prev, { speaker: 'ai', text: aiResponse }]);
                speakResponse(aiResponse);
            }
        } catch (e) {
            console.error("Gemini API Error:", e);
            const errorMessage = "عذراً، أواجه مشكلة في الاتصال بالذكاء الاصطناعي.";
            if (isMounted.current) {
                setError(errorMessage);
                setStatus(Status.ERROR);
                speakResponse(errorMessage);
            }
        }
    }, [speakResponse]);
    
    const handleSpeechResult = useCallback((event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript.trim()) {
            if (isMounted.current) {
                setTranscript(prev => [...prev, { speaker: 'user', text: finalTranscript }]);
                processTranscript(finalTranscript);
            }
        }
    }, [processTranscript]);

    const setupRecognition = useCallback(() => {
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ar-EG';

        recognition.onresult = handleSpeechResult;
        
        recognition.onend = () => {
            // If the session is still supposed to be active (i.e. not ended by user), and we were listening, listen again.
            // This handles cases where recognition ends due to silence.
            if (isMounted.current && isSessionActiveRef.current && status === Status.LISTENING) {
                 startListening();
            }
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('SpeechRecognition Error:', event.error, event.message);
            if (!isMounted.current) return;

            if (event.error === 'no-speech') {
                 // Don't error out, just try listening again if the session is active.
                 if (isSessionActiveRef.current) startListening();
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                 setError("تم رفض الوصول إلى الميكروفون. يرجى التحقق من أذونات المتصفح.");
                 setStatus(Status.ERROR);
                 setIsSessionActive(false);
            } else {
                 setError('حدث خطأ في التعرف على الصوت.');
                 setStatus(Status.ERROR);
            }
        };
        recognitionRef.current = recognition;
    }, [handleSpeechResult, startListening, status]);


    const startSession = useCallback((initialMessages: Message[] = []) => {
        if (!SpeechRecognition) {
            setError("متصفحك لا يدعم التعرف على الصوت.");
            setStatus(Status.ERROR);
            return;
        }
        
        const apiKey = getApiKey();
        if (!apiKey || apiKey.trim() === "") {
            setError("الرجاء إدخال مفتاح API صالح للبدء.");
            setStatus(Status.ERROR);
            return;
        }

        setIsSessionActive(true);
        setError(null);
        chatRef.current = createChatSession();

        setTranscript(initialMessages);
        setupRecognition();

        if (initialMessages.length > 0) {
            speakResponse(initialMessages[0].text);
        } else {
            setTimeout(() => {
                if(isMounted.current) startListening();
            }, 100);
        }
    }, [setupRecognition, speakResponse, startListening]);

    const stopSession = useCallback(() => {
        setIsSessionActive(false);
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.abort();
        }
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
        }
        window.speechSynthesis.cancel();
        
        setStatus(Status.IDLE);
        setTranscript([]);
    }, []);
    
    return { status, transcript, error, startSession, stopSession, isSessionActive };
};