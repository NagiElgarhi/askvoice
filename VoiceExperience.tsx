
import React, { useEffect, useRef } from 'react';
import { Status, Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { WhatsAppIcon } from './components/Icons';

interface VoiceExperienceProps {
    status: Status;
    transcript: Message[];
    error: string | null;
    isSessionActive: boolean;
    sendSuggestedQuestion: (question: string) => void;
}

export const VoiceExperience: React.FC<VoiceExperienceProps> = ({ 
    status, transcript, error, isSessionActive, sendSuggestedQuestion 
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const showWelcomeMessage = transcript.length === 0 && !isSessionActive;

    return (
        <div className="flex flex-col h-full">
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                {showWelcomeMessage && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-amber-900/80 px-4">
                         <img src="/logo.png?v=3" alt="شعار مشروع العلاج" className="w-32 h-32 mb-6 rounded-full object-cover border-4 border-white/50 shadow-lg opacity-90" />
                        <h2 className="text-2xl font-bold">مساعد مشروع العلاج لأطباء القاهرة</h2>
                        <p className="mt-2 max-w-md">اضغط على زر "بدء المكالمة" في الشريط العلوي للتحدث مع المساعد الصوتي.</p>
                     </div>
                )}
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

            <footer className="p-2 border-t border-amber-600/30 flex-shrink-0">
                 <div className="text-center opacity-90 px-4">
                     <p className="font-cinzel text-xs text-stone-700 select-none">
                        الحقوق الملكية لـ : Nagi<span className="z-special">z</span> Smart Solutions - NSS - 2025 C
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <WhatsAppIcon className="h-4 w-4 text-green-600"/>
                        <a href="https://wa.me/201066802250" target="_blank" rel="noopener noreferrer" className="text-stone-800 hover:text-green-600 transition-colors text-sm" dir="ltr">
                            00201066802250
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
