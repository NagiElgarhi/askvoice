
import React, { useState, useEffect } from 'react';
import { UploadIcon, LinkIcon, DocumentTextIcon, CheckCircleIcon, TrashIcon } from './components/Icons';
import { Knowledge } from './types';

const KNOWLEDGE_KEY = 'agent_knowledge_base';
const initialKnowledge: Knowledge = { texts: [], urls: [], files: [] };

export const AdminPage: React.FC = () => {
    const [texts, setTexts] = useState<string[]>([]);
    const [urls, setUrls] = useState<{ url: string; content: string | null }[]>([]);
    const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
    
    const [currentText, setCurrentText] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

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
            // Check for duplicates
            if (urls.some(u => u.url === currentUrl.trim())) return;
            setUrls(prev => [...prev, { url: currentUrl.trim(), content: null }]);
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
            Array.from(e.target.files).forEach(file => {
                const isSupported = file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md');
                if (!isSupported) {
                    alert(`نوع الملف ${file.name} غير مدعوم. يتم دعم الملفات النصية فقط.`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) {
                        setFiles(prev => {
                            if (prev.find(f => f.name === file.name)) return prev;
                            return [...prev, { name: file.name, content }];
                        });
                    }
                };
                reader.onerror = (error) => console.error("Error reading file:", error);
                reader.readAsText(file);
            });
             // Reset file input to allow re-uploading the same file
            e.target.value = '';
        }
    };
    
    const fetchUrlContent = async (url: string): Promise<string | null> => {
        if (!url || !url.startsWith('http')) return "رابط غير صالح.";
        try {
            // Using a CORS proxy to bypass browser restrictions.
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                return `فشل جلب المحتوى من الرابط: ${url} (الحالة: ${response.status})`;
            }
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            doc.querySelectorAll('script, style, link, meta, noscript, header, footer, nav, aside').forEach(el => el.remove());
            let textContent = doc.body.textContent || "";
            return textContent.replace(/\s\s+/g, ' ').trim();
        } catch (error) {
            console.error(`Error fetching or parsing URL ${url}:`, error);
            return `حدث خطأ أثناء جلب المحتوى من الرابط: ${url}`;
        }
    };

    const handleSave = async () => {
        setSaving(true);
        
        const urlsWithContent = await Promise.all(
            urls.map(async (urlItem) => {
                // Fetch content only if it hasn't been fetched before
                if (urlItem.content === null) {
                    const content = await fetchUrlContent(urlItem.url);
                    return { ...urlItem, content };
                }
                return urlItem;
            })
        );
        setUrls(urlsWithContent);

        const knowledge: Knowledge = { texts, urls: urlsWithContent, files };
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledge));
        
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const inputStyle = "w-full p-3 bg-black/5 border border-amber-600/50 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-stone-800 placeholder-stone-500";
    const labelStyle = "flex items-center text-lg font-semibold mb-2 text-amber-900";
    const buttonStyle = "px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-wavy-gold-button text-black hover:shadow-lg";

    const renderList = (items: any[], type: 'text' | 'url' | 'file') => (
        <div className="mt-4 space-y-2">
            {items.map((item, index) => {
                let displayText: string;
                let displayTitle: string;
                if (type === 'text') {
                    displayText = item;
                    displayTitle = item;
                } else if (type === 'url') {
                    displayText = item.url;
                    displayTitle = item.url;
                     if (item.content && item.content.startsWith('فشل')) {
                        displayText += ' (فشل الجلب)';
                    } else if (item.content !== null) {
                        displayText += ' (تم جلب المحتوى)';
                    } else {
                        displayText += ' (بانتظار الحفظ)';
                    }
                } else { // file
                    displayText = item.name;
                    displayTitle = item.name;
                }
                return (
                    <div key={`${type}-${index}`} className="flex items-center justify-between bg-black/5 p-2 rounded-md text-sm text-stone-800 border border-amber-600/10">
                        <p className="truncate pr-2" title={displayTitle}>{displayText}</p>
                        <button onClick={() => handleRemoveItem(type, index)} className="p-1 text-red-700 hover:text-red-600 hover:bg-red-300/50 rounded-full transition-colors">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 my-4">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black">إدارة قاعدة المعرفة</h1>
                <p className="text-lg text-stone-700 mt-2">
                    قم بتغذية المساعد بالبيانات التي سيعتمد عليها في إجاباته.
                </p>
            </header>

            <div className="space-y-8 max-w-2xl mx-auto">
                {/* Text Section */}
                <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
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
                <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
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
                <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
                     <label className={labelStyle}><UploadIcon /> تحميل ملفات</label>
                     <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-wavy-gold-button file:text-black hover:file:shadow-md cursor-pointer"
                        accept=".txt,.md,.json,.csv"
                     />
                     <p className="text-sm text-stone-600 mt-2">ملاحظة: سيتم تحليل محتوى الملفات النصية والروابط واستخدامه كقاعدة معرفة. قد تفشل عملية جلب المحتوى من بعض الروابط.</p>
                     {renderList(files, 'file')}
                </div>

                <div className="text-center pt-4">
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-wavy-gold-button text-black focus:ring-amber-500 shadow-lg disabled:opacity-50"
                        disabled={saving || saved}
                    >
                        {saving ? 'جاري الحفظ...' : (saved ? <><CheckCircleIcon /> تم الحفظ!</> : 'حفظ كل التغييرات')}
                    </button>
                </div>
            </div>
        </div>
    );
};