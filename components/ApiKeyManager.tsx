
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
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-glass-gradient backdrop-blur-xl shadow-2xl z-50 p-6 flex flex-col transform transition-transform duration-300 ease-in-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                        <KeyIcon className="h-6 w-6" />
                        <span>إدارة مفتاح API</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto text-gray-300 pl-2">
                    <div className="space-y-6">
                        {/* API Key Section */}
                        <div>
                            <h3 className="font-bold text-lg text-sky-400 mb-2">كيفية الحصول على مفتاح API:</h3>
                            <ol className="list-decimal list-inside space-y-2 mb-6 bg-gray-800/60 p-4 rounded-lg">
                                <li>اذهب إلى <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 font-semibold">Google AI Studio</a>.</li>
                                <li>سجّل الدخول باستخدام حساب Google الخاص بك.</li>
                                <li>انقر على زر <strong>"Get API key"</strong>.</li>
                                <li>أنشئ مفتاحًا جديدًا وانسخه.</li>
                            </ol>
                            
                            <div className="space-y-4">
                                <label htmlFor="api-key-input" className="font-semibold text-gray-200">أدخل مفتاح Google API الخاص بك:</label>
                                <input
                                    id="api-key-input"
                                    type="password"
                                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-gray-200 tracking-wider"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saved}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-lg font-bold rounded-md transition-all duration-300 ease-in-out bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saved ? <><CheckCircleIcon /> تم</> : 'حفظ المفتاح'}
                                    </button>
                                    <button
                                        onClick={handleRemove}
                                        className="px-4 py-2 font-bold rounded-md transition-all duration-300 ease-in-out bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                                    >
                                        إزالة
                                    </button>
                                </div>
                                {saved && <p className="text-green-400 text-center mt-2">تم حفظ المفتاح بنجاح!</p>}
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="mt-4 p-3 bg-amber-900/50 border border-amber-700/50 rounded-md text-amber-300 text-sm">
                    <strong>ملاحظة هامة:</strong> يتم تخزين مفتاحك محلياً في متصفحك فقط ولا تتم مشاركته مع أي خوادم.
                </div>
            </div>
        </div>
    );
};