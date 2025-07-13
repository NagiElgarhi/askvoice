
import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon, DocumentTextIcon, CheckCircleIcon, TrashIcon } from './components/Icons';
import { Knowledge } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

interface ProcessedFile {
    name: string;
    text: string;
}

export const AdminPage: React.FC = () => {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [parsingFiles, setParsingFiles] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.175/build/pdf.worker.mjs`;
        } catch (e) {
            console.error("Could not set PDF worker source", e);
        }
    }, []);

    const processFile = useCallback(async (file: File) => {
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        
        if (processedFiles.some(pf => pf.name === fileName) || parsingFiles.includes(fileName)) {
            alert(`تمت معالجة الملف ${fileName} بالفعل.`);
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
                    setProcessedFiles(prev => [...prev, { name: fileName, text: content }]);
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
    }, [processedFiles, parsingFiles]);

    const handleFileSelection = (files: FileList | null) => {
        if (files) {
            Array.from(files).forEach(processFile);
        }
    };

    const handleRemoveFile = (fileNameToRemove: string) => {
        setProcessedFiles(prev => prev.filter(file => file.name !== fileNameToRemove));
    };

    const handleSave = () => {
        setSaving(true);
        
        const allFileNames = processedFiles.map(file => file.name);
        const allChunks = processedFiles.flatMap(file => 
            file.text.split(/\n\s*\n+/)
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 20)
        );

        if (allChunks.length === 0) {
            alert('لم يتم استخلاص أي محتوى صالح من الملفات. يرجى التأكد من أن الملفات تحتوي على نص.');
            setSaving(false);
            return;
        }

        const knowledge: Knowledge = {
            texts: allChunks,
            urls: [],
            files: allFileNames
        };
        
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

    return (
        <div className="flex-1 overflow-y-auto p-4 my-4">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black">إدارة قاعدة المعرفة</h1>
                <p className="text-lg text-stone-700 mt-2">
                    ارفع ملفات PDF و Word لتغذية المساعد بالبيانات التي سيعتمد عليها.
                </p>
            </header>

            <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center p-10 border-2 border-dashed border-amber-600/30 bg-black/5 rounded-2xl">
                    <label 
                        htmlFor="file-upload" 
                        className="inline-flex items-center justify-center gap-4 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-wavy-gold-button text-black focus:ring-amber-500 shadow-lg cursor-pointer"
                    >
                        <UploadIcon className="h-8 w-8" />
                        <span>اختر الملفات</span>
                    </label>
                    <p className="text-sm text-stone-600 mt-3">
                        (يتم دعم ملفات PDF, DOCX)
                    </p>
                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelection(e.target.files)}
                        accept=".pdf,.docx"
                        disabled={parsingFiles.length > 0}
                    />
                </div>

                {parsingFiles.length > 0 && (
                    <div className="text-center text-sm text-stone-700 animate-pulse">
                        جاري تحليل: {parsingFiles.join(', ')}...
                    </div>
                )}

                {processedFiles.length > 0 && (
                    <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-amber-900">
                            <DocumentTextIcon />
                            <span>الملفات التي تمت معالجتها</span>
                        </h3>
                        <div className="space-y-2">
                            {processedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-black/5 p-2 rounded-md text-sm text-stone-800 border border-amber-600/10">
                                    <p className="truncate pr-2 font-mono" title={file.name}>{file.name}</p>
                                    <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-red-700 hover:text-red-600 hover:bg-red-300/50 rounded-full transition-colors" aria-label={`Remove ${file.name}`}>
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-center pt-4">
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-wavy-gold-button text-black focus:ring-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={saving || saved || parsingFiles.length > 0 || processedFiles.length === 0}
                    >
                        {saving ? 'جاري التجهيز...' : (saved ? <><CheckCircleIcon /> تم التنزيل!</> : 'تنزيل ملف المعرفة')}
                    </button>
                     {saved && <p className="text-green-700 mt-2">تم تنزيل ملف `knowledge.json` بنجاح.</p>}
                </div>
            </div>
        </div>
    );
};
