import React, { useState, useEffect } from 'react';
import { KeyIcon, XIcon, CheckCircleIcon, TrashIcon } from './Icons';

const API_KEY_STORAGE_KEY = 'google-ai-api-key';

export const ApiKeyManager: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isKeyPresent, setIsKeyPresent] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
            setIsKeyPresent(true);
        }
    }, []);

    const handleSave = () => {
        const trimmedKey = apiKey.trim();
        if (trimmedKey) {
            localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
            setIsSaved(true);
            setTimeout(() => {
                setIsSaved(false);
                window.location.reload();
            }, 1500);
        }
    };

    const handleDelete = () => {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        window.location.reload();
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
                
                {isKeyPresent ? (
                    <div className="space-y-4">
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg" role="alert">
                           <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 flex-shrink-0"/>
                                <p className="font-bold">تم تكوين مفتاح API بنجاح.</p>
                           </div>
                        </div>
                        <p className="text-sm text-stone-600 text-center pt-2">
                           يمكنك حذفه للبدء من جديد، أو استبداله بمفتاح آخر.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                             <button
                                onClick={handleDelete}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-md transition-colors duration-300 ease-in-out shadow-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-4 focus:ring-red-400"
                                aria-label="حذف المفتاح الحالي"
                            >
                                <TrashIcon className="h-5 w-5" />
                                <span>حذف المفتاح</span>
                            </button>
                             <button
                                onClick={() => setIsKeyPresent(false)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-md transition-all duration-300 ease-in-out shadow-lg bg-wavy-gold-button text-black focus:outline-none focus:ring-4 focus:ring-amber-500"
                                aria-label="استبدال المفتاح الحالي"
                            >
                                <KeyIcon className="h-5 w-5" />
                                <span>استبدال</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-stone-700 mb-4">
                            يرجى إدخال مفتاح Google Gemini API الخاص بك. يمكنك الحصول على مفتاح من{' '}
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-amber-700 font-bold hover:underline"
                            >
                                Google AI Studio
                            </a>
                            . سيتم حفظ المفتاح في التخزين المحلي لمتصفحك.
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
                                disabled={isSaved || !apiKey.trim()}
                                className={`flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 text-lg font-bold rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 shadow-lg ${
                                    isSaved 
                                    ? 'bg-green-600 focus:ring-green-500 text-white' 
                                    : 'bg-wavy-gold-button text-black focus:ring-amber-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
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
                            سيتم إعادة تحميل الصفحة بعد حفظ أو حذف المفتاح لتطبيق التغييرات.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};