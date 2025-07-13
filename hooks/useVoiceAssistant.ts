
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

    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

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

        const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
            return new Promise(resolve => {
                let voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    return resolve(voices);
                }
                window.speechSynthesis.onvoiceschanged = () => {
                    voices = window.speechSynthesis.getVoices();
                    resolve(voices);
                };
            });
        };

        const executeSpeak = async () => {
            // Cancel any currently speaking utterance to prevent overlap
            window.speechSynthesis.cancel();
            if (!isMounted.current) return;
            
            setStatus(Status.SPEAKING);

            const utterance = new SpeechSynthesisUtterance(text);
            try {
                const voices = await getVoices();
                
                // Prioritize "Hoda" voice for quality
                let desiredVoice = voices.find(v => v.name === 'Hoda' && v.lang === 'ar-EG');
                
                // If Hoda is not found, find any other Egyptian Arabic voice
                if (!desiredVoice) {
                    desiredVoice = voices.find(v => v.lang === 'ar-EG');
                }

                if (desiredVoice) {
                    utterance.voice = desiredVoice;
                }

                utterance.lang = 'ar-EG';
                utterance.rate = 1.0;
                utteranceRef.current = utterance;

                utterance.onend = () => {
                    if (isMounted.current && isSessionActiveRef.current) {
                        startListening();
                    } else {
                        if (isMounted.current) setStatus(Status.IDLE);
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
            } catch (err) {
                 console.error("Could not get voices for speech synthesis", err);
                 // Fallback to speaking without a specific voice
                 if (isMounted.current) {
                     window.speechSynthesis.speak(utterance);
                 }
            }
        };

        executeSpeak();

    }, [startListening]);


    const processTranscript = useCallback(async (text: string) => {
        if (!chatRef.current) {
            const errorMessage = "لم تبدأ جلسة المحادثة. يرجى التأكد من إضافة مفتاح API صحيح عبر أيقونة المفتاح في الأعلى.";
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
                let aiResponseData;
                const rawText = response.text;

                try {
                    // Use a regex to find a JSON block, either in a markdown code block or raw.
                    const match = rawText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
                    if (!match) {
                        throw new Error("لم يتم العثور على كتلة JSON في الرد.");
                    }
                    
                    // Take the first valid group.
                    const jsonString = match[1] || match[2];
                    if (!jsonString) {
                         throw new Error("كتلة JSON المستخرجة فارغة.");
                    }

                    aiResponseData = JSON.parse(jsonString);

                } catch(parseError: any) {
                    console.error("فشل في تحليل JSON من رد AI:", parseError);
                    console.error("النص الأصلي من AI:", rawText);
                    const parseErrorMessage = "عذراً، لم أتمكن من فهم رد المساعد. يبدو أنه ليس بالتنسيق الصحيح.";
                    if (isMounted.current) {
                        setError(parseErrorMessage);
                        setStatus(Status.ERROR);
                        speakResponse(parseErrorMessage);
                    }
                    return; // Stop further processing
                }

                const answerParts: string[] = aiResponseData.answer || [];
                const spokenSummary: string = aiResponseData.spoken_summary || (answerParts.length > 0 ? answerParts[0] : '');
                const suggested: string[] = aiResponseData.suggested_questions || [];

                if (answerParts.length > 0) {
                     setTranscript(prev => [...prev, { 
                        speaker: 'ai', 
                        textParts: answerParts, 
                        spokenSummary: spokenSummary,
                        suggestedQuestions: suggested 
                    }]);
                    speakResponse(spokenSummary);
                } else {
                     const fallbackText = "لم أتمكن من إيجاد إجابة مناسبة. هل يمكنك إعادة صياغة سؤالك؟"
                    setTranscript(prev => [...prev, { speaker: 'ai', textParts: [fallbackText], suggestedQuestions: [] }]);
                    speakResponse(fallbackText);
                }
            }
        } catch (e: any) {
            console.error("Gemini API Error:", e);
            const errorMessage = e.message || "عذراً، أواجه مشكلة في معالجة الرد.";
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
                const userMessage: Message = { speaker: 'user', text: finalTranscript.trim() };
                setTranscript(prev => [...prev, userMessage]);
                processTranscript(finalTranscript.trim());
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
            // If the session is still supposed to be active (i.e. not ended by user), 
            // and the assistant's state is still 'LISTENING', it means recognition ended
            // due to silence. We restart it to maintain a seamless experience.
            if (isMounted.current && isSessionActiveRef.current && statusRef.current === Status.LISTENING) {
                 startListening();
            }
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (!isMounted.current) return;

            // 'no-speech' and 'aborted' are not critical errors. 
            // The onend handler will gracefully restart the listening loop if the session is active.
            if (event.error === 'no-speech' || event.error === 'aborted') {
                console.log(`Speech recognition event: ${event.error}.`);
                return;
            }

            console.error('SpeechRecognition Error:', event.error, event.message);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                 setError("تم رفض الوصول إلى الميكروفون. يرجى التحقق من أذونات المتصفح.");
                 setStatus(Status.ERROR);
                 setIsSessionActive(false);
            } else {
                 setError('حدث خطأ في التعرف على الصوت.');
                 setStatus(Status.ERROR);
            }
        };
        recognitionRef.current = recognition;
    }, [handleSpeechResult, startListening]);


    const startSession = useCallback(async (initialMessages: Message[] = []) => {
        if (!SpeechRecognition) {
            setError("متصفحك لا يدعم التعرف على الصوت.");
            setStatus(Status.ERROR);
            return;
        }
        
        setIsSessionActive(true);
        setError(null);
        
        try {
            setStatus(Status.THINKING); // Indicate that we are setting up the session
            chatRef.current = await createChatSession();
        } catch(e: any) {
             console.error("Failed to create chat session:", e);
             setError(e.message || "فشل في تهيئة جلسة المحادثة. يرجى التأكد من إضافة مفتاح API صحيح عبر أيقونة المفتاح في الأعلى.");
             setStatus(Status.ERROR);
             setIsSessionActive(false);
             return;
        }


        setTranscript(initialMessages);
        setupRecognition();

        const firstMessage = initialMessages.find(m => m.speaker === 'ai');
        if (firstMessage?.spokenSummary) {
             speakResponse(firstMessage.spokenSummary);
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



    const sendSuggestedQuestion = useCallback((question: string) => {
        if (isMounted.current) {
            const userMessage: Message = { speaker: 'user', text: question };
            setTranscript(prev => [...prev, userMessage]);
            processTranscript(question);
            window.speechSynthesis.cancel();
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        }
    }, [processTranscript]);
    
    return { status, transcript, error, startSession, stopSession, isSessionActive, sendSuggestedQuestion };
};