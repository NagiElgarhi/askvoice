
import React, { useState } from 'react';
import { VoiceExperience } from './VoiceExperience';
import { AdminPage } from './AdminPage';
import { ApiKeyManager } from './components/ApiKeyManager';
import { KeyIcon } from './components/Icons';

const App: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('nagi') === 'nagi';
    const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);


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
            <div className="flex flex-col h-[95vh] my-4 bg-main-container text-stone-800 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50">
                <header className="p-4 flex justify-between items-center border-b border-amber-600/50 flex-shrink-0">
                    <div className="w-8"></div> {/* Spacer */}
                    <div className="flex items-center gap-3">
                         <h1 className="text-xl sm:text-2xl font-bold text-black text-center">مساعد أطباء نقابة القاهرة</h1>
                    </div>
                    <button 
                        onClick={() => setIsApiKeyManagerOpen(true)} 
                        className="p-2 rounded-full text-amber-800 hover:bg-black/10 transition-colors"
                        aria-label="إدارة مفتاح API"
                    >
                        <KeyIcon className="w-6 h-6"/>
                    </button>
                </header>
                <div className="flex-1 flex flex-col overflow-y-hidden">
                     <VoiceExperience />
                </div>
            </div>
        </>
    );
};

export default App;