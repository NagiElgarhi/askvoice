
import React from 'react';
import { VoiceExperience } from './VoiceExperience';
import { AdminPage } from './AdminPage';

const App: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('nagi') === 'nagi';

    if (isAdmin) {
        return (
             <div className="flex flex-col h-[95vh] my-4 bg-main-container text-stone-800 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50">
                <AdminPage />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-[95vh] my-4 bg-main-container text-stone-800 max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50">
                <header className="p-4 flex justify-center items-center border-b border-amber-600/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <h1 className="text-xl sm:text-2xl font-bold text-black text-center">مساعد أطباء نقابة القاهرة</h1>
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-y-hidden">
                     <VoiceExperience />
                </div>
            </div>
        </>
    );
};

export default App;
