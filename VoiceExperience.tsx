
import React, { useEffect, useRef } from 'react';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { Status } from './types';
import { ChatMessage } from './components/ChatMessage';
import { StatusIndicator } from './components/StatusIndicator';
import { PhoneIcon, StopCircleIcon, WhatsAppIcon } from './components/Icons';

export const VoiceExperience: React.FC = () => {
    const { status, transcript, startSession, stopSession, error, isSessionActive, sendSuggestedQuestion } = useVoiceAssistant();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleToggleSession = () => {
        if (isSessionActive) {
            stopSession();
        } else {
            const welcomeMessage = 'أهلاً بك في خدمة العملاء، كيف يمكنني مساعدتك اليوم؟';
            startSession([{
                speaker: 'ai', 
                textParts: [welcomeMessage], 
                spokenSummary: welcomeMessage,
                suggestedQuestions: ["ما هي مواعيد عمل النقابة؟", "كيف أسجل في مشروع العلاج؟", "ما هي رسوم الاشتراك السنوي؟"]
            }]);
        }
    };

    const getStatusText = () => {
        switch (status) {
            case Status.LISTENING: return "الاستماع...";
            case Status.THINKING: return "جاري التفكير...";
            case Status.SPEAKING: return "جاري التحدث...";
            case Status.ERROR: return error || "حدث خطأ";
            case Status.IDLE: return isSessionActive ? "" : "جاهز لبدء المحادثة";
            default: return "مساعد خدمة العملاء";
        }
    };

    return (
        <div className="flex flex-col h-full">
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 my-4 space-y-6">
                {transcript.map((message, index) => (
                    <ChatMessage 
                        key={index} 
                        message={message}
                        onSuggestedQuestionClick={sendSuggestedQuestion}
                    />
                ))}
                {status === Status.ERROR && error && (
                     <div className="flex justify-center">
                        <div className="bg-red-200 border border-red-400 text-red-800 p-3 rounded-lg max-w-md text-center">
                            {error}
                        </div>
                    </div>
                )}
            </main>

            <footer className={`relative flex flex-col items-center justify-center p-4 flex-shrink-0 ${transcript.length === 0 && !isSessionActive ? 'flex-1' : ''}`}>
                <div className="absolute bottom-2 right-0 left-0 text-center opacity-90 px-4">
                     <p className="font-cinzel text-xs text-stone-700 select-none">
                        الحقوق الملكية لـ : Nagi<span className="z-special">z</span> Smart Solutions - NSS - 2025 C
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2.5">
                        <WhatsAppIcon className="h-4 w-4 text-green-600"/>
                        <a href="https://wa.me/201066802250" target="_blank" rel="noopener noreferrer" className="text-stone-800 hover:text-green-600 transition-colors text-sm" dir="ltr">
                            00201066802250
                        </a>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-4 transform -translate-y-[120px]">
                    <StatusIndicator status={status} />
                    <p className="text-lg text-amber-900 h-6 transition-opacity duration-300">{getStatusText()}</p>
                    <button
                        onClick={handleToggleSession}
                        className={`flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 shadow-lg ${
                            isSessionActive 
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' 
                            : 'bg-wavy-gold-button text-black focus:ring-amber-500'
                        }`}
                    >
                        {isSessionActive ? <StopCircleIcon /> : <PhoneIcon />}
                        <span>{isSessionActive ? 'إنهاء المكالمة' : 'بدء المكالمة'}</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};