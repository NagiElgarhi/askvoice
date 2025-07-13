import React, { useState, useEffect } from 'react';
import { KeyIcon, XIcon, CheckCircleIcon } from './Icons';

const API_KEY_STORAGE_KEY = 'google-ai-api-key';

export const ApiKeyManager: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
            setIsSaved(true);
            setTimeout(() => {
                setIsSaved(false);
                // Reload to re-initialize the chat session with the new key.
                window.location.reload();
            }, 1500);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-main-container text-stone-800 max-w-lg w-full mx-auto shadow-2xl rounded-2xl overflow-hidden ring-1 ring-amber-700/50 p-6 sm:p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                        <KeyIcon className="w-7 h-7 text-amber-800" />
                        <span>إدارة مفتاح API</span>
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="إغلاق">
                        <XIcon className="w-6 h-6 text-stone-600" />
                    </button>
                </div>
                
                <p className="text-stone-700 mb-4">
                    يرجى إدخال مفتاح Google Gemini API الخاص بك. سيتم حفظ المفتاح في التخزين المحلي لمتصفحك.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="أدخل مفتاح API هنا..."
                        className="flex-grow p-3 bg-black/5 border border-amber-600/50 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-stone-800 placeholder-stone-500"
                        aria-label="API Key Input"
                    />
                     <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`flex items-center justify-center gap-3 px-6 py-3 text-lg font-bold rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 shadow-lg ${
                            isSaved 
                            ? 'bg-green-600 focus:ring-green-500 text-white' 
                            : 'bg-wavy-gold-button text-black focus:ring-amber-500 hover:shadow-xl'
                        }`}
                    >
                        {isSaved ? (
                            <>
                                <CheckCircleIcon className="w-6 h-6" />
                                <span>تم الحفظ!</span>
                            </>
                        ) : (
                            <span>حفظ المفتاح</span>
                        )}
                    </button>
                </div>
                 <p className="text-xs text-stone-600 mt-4">
                    سيتم إعادة تحميل الصفحة بعد حفظ المفتاح لتطبيق التغييرات.
                </p>
            </div>
        </div>
    );
};