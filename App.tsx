
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
            <div className="flex flex-col h-[95vh] my-4 bg-glass-gradient backdrop-blur-xl text-gray-200 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
                <header className="p-4 flex justify-center items-center border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <h1 className="text-xl sm:text-2xl font-bold text-gray-100 text-center">مساعد أطباء نقابة القاهرة</h1>
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
