
import React, { useState, useEffect } from 'react';
import { AdminPage } from './AdminPage';
import { VoiceExperience } from './VoiceExperience';
import { ApiKeyManager } from './components/ApiKeyManager';

const App: React.FC = () => {
    const [page, setPage] = useState<'main' | 'admin'>('main');
    const [isApiManagerOpen, setIsApiManagerOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('nagi') === 'nagi') {
            setPage('admin');
        }
    }, []);

    return (
        <>
            <div className="flex flex-col h-[95vh] my-4 bg-wavy-gold-button text-stone-800 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50">
                <header className="p-4 flex justify-center items-center border-b border-amber-600/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <h1 className="text-xl sm:text-2xl font-bold text-black text-center">مساعد أطباء نقابة القاهرة</h1>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-y-hidden">
                     {page === 'main' ? <VoiceExperience setIsApiManagerOpen={setIsApiManagerOpen} /> : <AdminPage />}
                </div>
            </div>
            {isApiManagerOpen && <ApiKeyManager onClose={() => setIsApiManagerOpen(false)} />}
        </>
    );
};

export default App;