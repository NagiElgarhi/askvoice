import React, { useState, useEffect } from 'react';
import { UploadIcon, LinkIcon, DocumentTextIcon, CheckCircleIcon, TrashIcon } from './components/Icons';
import { Knowledge } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

const initialKnowledge: Knowledge = { texts: [], urls: [], files: [] };

export const AdminPage: React.FC = () => {
    const [texts, setTexts] = useState<string[]>([]);
    const [urls, setUrls] = useState<{ url: string; content: string | null }[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    
    const [currentText, setCurrentText] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [parsingFiles, setParsingFiles] = useState<string[]>([]);

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        // Set workerSrc for pdf.js. This is required for it to work in a browser environment.
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.175/build/pdf.worker.mjs`;
        } catch (e) {
            console.error("Could not set PDF worker source", e);
        }
    }, []);
    
    const handleAddItem = (type: 'text' | 'url') => {
        if (type === 'text' && currentText.trim()) {
            setTexts(prev => [...prev, currentText.trim()]);
            setCurrentText('');
        }
        if (type === 'url' && currentUrl.trim()) {
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
                const fileName = file.name;
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                
                if (files.includes(fileName) || parsingFiles.includes(fileName)) {
                    return;
                }

                const isSupported = fileExtension === 'pdf' || fileExtension === 'docx';
                if (!isSupported) {
                    alert(`نوع الملف ${fileName} غير مدعوم. يتم دعم ملفات PDF و DOCX فقط.`);
                    return;
                }
                
                setParsingFiles(prev => [...prev, fileName]);

                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    try {
                        const arrayBuffer = event.target?.result as ArrayBuffer;
                        if (!arrayBuffer) throw new Error("لم يتم قراءة الملف.");

                        let content: string | null = null;

                        if (fileExtension === 'pdf') {
                            const typedArray = new Uint8Array(arrayBuffer);
                            const pdf = await pdfjsLib.getDocument(typedArray).promise;
                            let fullText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                                fullText += pageText + '\n\n';
                            }
                            content = fullText.trim();
                        } else if (fileExtension === 'docx') {
                            const result = await mammoth.extractRawText({ arrayBuffer });
                            content = result.value;
                        }
                        
                        if (content) {
                            // Split content into meaningful chunks (paragraphs)
                            const chunks = content.split(/\n\s*\n+/)
                                .map(chunk => chunk.trim())
                                .filter(chunk => chunk.length > 20); // Only keep chunks with more than 20 chars

                            if (chunks.length > 0) {
                                setTexts(prev => [...prev, ...chunks]);
                            }
                             // Add only filename to files list to mark it as processed
                            setFiles(prev => [...prev, fileName]);
                        }
                    } catch (error) {
                        console.error(`Error parsing file ${fileName}:`, error);
                        alert(`حدث خطأ أثناء تحليل الملف: ${fileName}`);
                    } finally {
                        setParsingFiles(prev => prev.filter(name => name !== fileName));
                    }
                };
                
                reader.onerror = () => {
                    console.error(`Error reading file ${fileName}`);
                    alert(`حدث خطأ أثناء قراءة الملف: ${fileName}`);
                    setParsingFiles(prev => prev.filter(name => name !== fileName));
                };
                
                reader.readAsArrayBuffer(file);
            });
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
        
        // Create and download knowledge.json file
        const knowledgeBlob = new Blob([JSON.stringify(knowledge, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(knowledgeBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'knowledge.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
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
                    displayText = item;
                    displayTitle = item;
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
                        accept=".pdf,.docx"
                        disabled={parsingFiles.length > 0}
                     />
                     <p className="text-sm text-stone-600 mt-2">ملاحظة: يتم دعم ملفات PDF و DOCX فقط. سيتم تحليلها وإضافتها كنصوص منفصلة.</p>
                     {parsingFiles.length > 0 && (
                        <div className="mt-2 text-sm text-stone-700 animate-pulse">
                           جاري تحليل: {parsingFiles.join(', ')}...
                        </div>
                     )}
                     {files.length > 0 && <h4 className="font-semibold mt-4 mb-2 text-stone-800">الملفات المعالجة:</h4>}
                     {renderList(files, 'file')}
                </div>

                <div className="text-center pt-4">
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-wavy-gold-button text-black focus:ring-amber-500 shadow-lg disabled:opacity-50"
                        disabled={saving || saved || parsingFiles.length > 0}
                    >
                        {saving ? 'جاري الحفظ...' : (saved ? <><CheckCircleIcon /> تم الحفظ وتنزيل الملف!</> : 'حفظ وتنزيل الملف')}
                    </button>
                </div>
            </div>
        </div>
    );
};