
import React, { useState, useEffect } from 'react';
import { UploadIcon, LinkIcon, DocumentTextIcon, CheckCircleIcon, TrashIcon } from './components/Icons';
import { Knowledge } from './types';

const KNOWLEDGE_KEY = 'agent_knowledge_base';
const initialKnowledge: Knowledge = { texts: [], urls: [], files: [] };

export const AdminPage: React.FC = () => {
    const [texts, setTexts] = useState<string[]>([]);
    const [urls, setUrls] = useState<string[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    
    const [currentText, setCurrentText] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const storedKnowledge = localStorage.getItem(KNOWLEDGE_KEY);
            if (storedKnowledge) {
                const data: Knowledge = JSON.parse(storedKnowledge);
                setTexts(data.texts || []);
                setUrls(data.urls || []);
                setFiles(data.files || []);
            }
        } catch (error) {
            console.error("Failed to parse knowledge from localStorage", error);
        }
    }, []);
    
    const handleAddItem = (type: 'text' | 'url') => {
        if (type === 'text' && currentText.trim()) {
            setTexts(prev => [...prev, currentText.trim()]);
            setCurrentText('');
        }
        if (type === 'url' && currentUrl.trim()) {
            setUrls(prev => [...prev, currentUrl.trim()]);
            setCurrentUrl('');
        }
    };
    
    const handleRemoveItem = (type: 'text' | 'url' | 'file', index: number) => {
        if (type === 'text') setTexts(prev => prev.filter((_, i) => i !== index));
        if (type === 'url') setUrls(prev => prev.filter((_, i) => i !== index));
        if (type === 'file') setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFileNames = Array.from(e.target.files).map(f => f.name);
            setFiles(prev => [...prev, ...newFileNames].filter((name, index, self) => self.indexOf(name) === index));
        }
    };

    const handleSave = () => {
        const knowledge: Knowledge = { texts, urls, files };
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const inputStyle = "w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-gray-200 placeholder-gray-500";
    const labelStyle = "flex items-center text-lg font-semibold mb-2 text-sky-400";
    const buttonStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-sky-600 hover:bg-sky-500 text-white";

    const renderList = (items: string[], type: 'text' | 'url' | 'file') => (
        <div className="mt-4 space-y-2">
            {items.map((item, index) => (
                <div key={`${type}-${index}`} className="flex items-center justify-between bg-gray-700 p-2 rounded-md text-sm text-gray-300">
                    <p className="truncate pr-2">{item}</p>
                    <button onClick={() => handleRemoveItem(type, index)} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-full transition-colors">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 my-4">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-100">إدارة قاعدة المعرفة</h1>
                <p className="text-lg text-gray-400 mt-2">
                    قم بتغذية المساعد بالبيانات التي سيعتمد عليها في إجاباته.
                </p>
            </header>

            <div className="space-y-8 max-w-2xl mx-auto">
                {/* Text Section */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <label className={labelStyle}> <DocumentTextIcon /> إضافة نص</label>
                    <div className="flex gap-2">
                        <textarea
                            rows={2}
                            className={inputStyle}
                            placeholder="أدخل معلومة نصية..."
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                        />
                        <button onClick={() => handleAddItem('text')} className={buttonStyle}>إضافة</button>
                    </div>
                    {renderList(texts, 'text')}
                </div>

                {/* URL Section */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                    <label className={labelStyle}><LinkIcon /> إضافة رابط</label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            className={inputStyle}
                            placeholder="https://example.com"
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                        />
                        <button onClick={() => handleAddItem('url')} className={buttonStyle}>إضافة</button>
                    </div>
                    {renderList(urls, 'url')}
                </div>
                
                {/* File Section */}
                <div className="bg-gray-800/50 p-4 rounded-lg">
                     <label className={labelStyle}><UploadIcon /> تحميل ملفات</label>
                     <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500"
                        accept=".pdf,.doc,.docx,image/*"
                     />
                     <p className="text-sm text-gray-500 mt-2">ملاحظة: سيتم استخدام أسماء الملفات فقط كجزء من قاعدة المعرفة.</p>
                     {renderList(files, 'file')}
                </div>

                <div className="text-center pt-4">
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-lg disabled:opacity-50"
                        disabled={saved}
                    >
                        {saved ? <><CheckCircleIcon /> تم الحفظ!</> : 'حفظ كل التغييرات'}
                    </button>
                </div>
            </div>
        </div>
    );
};
