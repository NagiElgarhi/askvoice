
import React, { useState, useEffect } from 'react';
import { KeyIcon, XIcon, CheckCircleIcon } from './Icons';

const API_KEY_LOCAL_STORAGE_KEY = 'google_api_key';

interface ApiKeyManagerProps {
    onClose: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const storedKey = localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY);
            if (storedKey) {
                setApiKey(storedKey);
            }
        } catch (e) {
            console.warn("Could not access localStorage");
        }
    }, []);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem(API_KEY_LOCAL_STORAGE_KEY, apiKey.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleRemove = () => {
        localStorage.removeItem(API_KEY_LOCAL_STORAGE_KEY);
        setApiKey('');
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-wavy-gold-button shadow-2xl z-50 p-6 flex flex-col transform transition-transform duration-300 ease-in-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                        <KeyIcon className="h-6 w-6" />
                        <span>إدارة مفتاح API</span>
                    </h2>
                    <button onClick={onClose} className="text-stone-700 hover:text-black transition-colors p-1 rounded-full hover:bg-black/10">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto text-stone-800 pl-2">
                    <div className="space-y-6">
                        {/* API Key Section */}
                        <div>
                            <h3 className="font-bold text-lg text-amber-900 mb-2">كيفية الحصول على مفتاح API:</h3>
                            <ol className="list-decimal list-inside space-y-2 mb-6 bg-black/5 p-4 rounded-lg border border-amber-600/20">
                                <li>اذهب إلى <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:text-amber-900 font-semibold">Google AI Studio</a>.</li>
                                <li>سجّل الدخول باستخدام حساب Google الخاص بك.</li>
                                <li>انقر على زر <strong>"Get API key"</strong>.</li>
                                <li>أنشئ مفتاحًا جديدًا وانسخه.</li>
                            </ol>
                            
                            <div className="space-y-4">
                                <label htmlFor="api-key-input" className="font-semibold text-black">أدخل مفتاح Google API الخاص بك:</label>
                                <input
                                    id="api-key-input"
                                    type="password"
                                    className="w-full p-3 bg-black/5 border border-amber-600/50 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-stone-800 tracking-wider"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saved}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-lg font-bold rounded-md transition-all duration-300 ease-in-out bg-wavy-gold-button text-black hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saved ? <><CheckCircleIcon /> تم</> : 'حفظ المفتاح'}
                                    </button>
                                    <button
                                        onClick={handleRemove}
                                        className="px-4 py-2 font-bold rounded-md transition-all duration-300 ease-in-out bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                                    >
                                        إزالة
                                    </button>
                                </div>
                                {saved && <p className="text-green-800 text-center mt-2">تم حفظ المفتاح بنجاح!</p>}
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="mt-4 p-3 bg-black/10 border border-amber-600/20 rounded-md text-stone-800 text-sm">
                    <strong>ملاحظة هامة:</strong> يتم تخزين مفتاحك محلياً في متصفحك فقط ولا تتم مشاركته مع أي خوادم.
                </div>
            </div>
        </div>
    );
};