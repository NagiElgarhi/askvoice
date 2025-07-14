
import React, { useState, useCallback } from 'react';
import { VoiceExperience } from './VoiceExperience';
import { AdminPage } from './AdminPage';
import { ApiKeyManager } from './components/ApiKeyManager';
import { XIcon, KeyIcon } from './components/Icons';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { CallControlButton } from './components/CallControlButton';

const App: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('nagi') === 'nagi';
    const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const { status, transcript, startSession, stopSession, error, isSessionActive, sendSuggestedQuestion } = useVoiceAssistant();

    const handleStartSession = useCallback(() => {
        const welcomeMessage = 'أهلاً بك في خدمة مساعد مشروع العلاج، كيف يمكنني مساعدتك اليوم؟';
        startSession([{
            speaker: 'ai', 
            textParts: [welcomeMessage], 
            spokenSummary: welcomeMessage,
            suggestedQuestions: ["متى يمكنني الاشتراك في مشروع العلاج؟", "ما هي الأوراق المطلوبة للاشتراك لأول مرة؟"]
        }]);
    }, [startSession]);

    if (isAdmin) {
        return (
             <div className="flex flex-col h-[95vh] my-4 bg-main-container text-stone-800 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50">
                <AdminPage />
            </div>
        );
    }

    return (
        <>
            {isApiKeyManagerOpen && <ApiKeyManager onClose={() => setIsApiKeyManagerOpen(false)} />}
            
            {/* Floating Action Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-6 right-6 z-40 w-20 h-20 rounded-full bg-wavy-gold-button shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 ${isChatOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="افتح المحادثة"
            >
                <img src="./logo.png" alt="شعار مشروع العلاج" className="w-16 h-16 p-1 rounded-full object-cover" />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-4 right-4 z-50 flex flex-col bg-main-container text-stone-800 shadow-2xl rounded-2xl ring-1 ring-amber-700/50 w-[95vw] max-w-md h-[90vh] max-h-[700px] transform transition-all duration-500 ease-in-out ${isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'}`}>
                <header className="p-3 flex justify-between items-center border-b border-amber-600/50 flex-shrink-0">
                    <CallControlButton 
                        status={status} 
                        isSessionActive={isSessionActive}
                        onStart={handleStartSession}
                        onEnd={stopSession}
                    />
                    <div className="flex items-center gap-3">
                         <h1 className="text-base sm:text-lg font-bold text-black text-center">مساعد مشروع العلاج لأطباء القاهرة</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsApiKeyManagerOpen(true)}
                            className="p-2 rounded-full text-amber-800 hover:bg-black/10 transition-colors"
                            aria-label="إدارة مفتاح API"
                        >
                            <KeyIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => setIsChatOpen(false)} 
                            className="p-2 rounded-full text-amber-800 hover:bg-black/10 transition-colors"
                            aria-label="إغلاق المحادثة"
                        >
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-y-hidden">
                     <VoiceExperience 
                        status={status}
                        transcript={transcript}
                        error={error}
                        isSessionActive={isSessionActive}
                        sendSuggestedQuestion={sendSuggestedQuestion}
                     />
                </div>
            </div>
        </>
    );
};

export default App;
