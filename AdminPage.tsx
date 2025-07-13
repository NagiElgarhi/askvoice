import React, { useState, useCallback } from 'react';
import { UploadIcon, DocumentTextIcon, CheckCircleIcon, TrashIcon } from './components/Icons';
import { Knowledge } from './types';
import { extractTextFromData } from './services/geminiService';

interface ProcessedFile {
    name: string;
    text: string;
}

const InstructionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto ring-1 ring-amber-300" 
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold text-amber-800 mb-4 text-center">تم تنزيل الملف بنجاح!</h2>
            <p className="text-lg mb-6 text-stone-700 text-center">
                الآن، يرجى اتباع هذه الخطوات الهامة جداً لتحديث المساعد:
            </p>
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <ol className="list-decimal list-inside space-y-3 text-base text-stone-800" style={{ direction: 'rtl', textAlign: 'right' }}>
                    <li>اذهب إلى مجلد مشروعك على جهاز الكمبيوتر الخاص بك.</li>
                    <li>ابحث عن الملف القديم المسمى <code>knowledge.json</code>.</li>
                    <li className="font-bold text-red-700 bg-red-100 p-2 rounded-md">
                        <span className="font-mono text-xl mr-2">❗</span>
                        احذف الملف القديم بالكامل.
                    </li>
                    <li>ابحث عن الملف الجديد الذي قمت بتنزيله للتو (اسمه أيضاً <code>knowledge.json</code>) وانقله إلى نفس مكان الملف القديم.</li>
                </ol>
            </div>
            <p className="mt-4 text-sm text-stone-600 text-center">
                هذه العملية تضمن أن المساعد يستخدم أحدث المعلومات التي قدمتها.
            </p>
            <div className="text-center mt-8">
                <button
                    onClick={onClose}
                    className="px-10 py-3 bg-amber-600 text-white text-lg font-bold rounded-full hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
                >
                    لقد فهمت
                </button>
            </div>
        </div>
    </div>
);

export const AdminPage: React.FC = () => {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [parsingFiles, setParsingFiles] = useState<string[]>([]);
    const [showInstructions, setShowInstructions] = useState(false);
    
    const processFile = useCallback(async (file: File) => {
        const fileName = file.name;
        
        if (processedFiles.some(pf => pf.name === fileName) || parsingFiles.includes(fileName)) {
            alert(`تمت معالجة الملف ${fileName} بالفعل.`);
            return;
        }

        const mimeType = file.type;
        const isSupported = mimeType === 'application/pdf' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (!isSupported) {
            alert(`نوع الملف ${fileName} غير مدعوم. يتم دعم ملفات PDF و DOCX فقط.`);
            return;
        }
        
        setParsingFiles(prev => [...prev, fileName]);

        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const dataUrl = event.target?.result as string;
                if (!dataUrl) throw new Error("لم يتم قراءة الملف.");

                const base64Data = dataUrl.split(',')[1];
                if (!base64Data) throw new Error("Could not extract base64 data from file.");

                const extractedText = await extractTextFromData(base64Data, mimeType);
                
                if (extractedText) {
                    setProcessedFiles(prev => [...prev, { name: fileName, text: extractedText.trim() }]);
                } else {
                     throw new Error("لم يتمكن المساعد من استخلاص أي نص.");
                }
            } catch (error: any) {
                console.error(`Error processing file ${fileName} with Gemini:`, error);
                const errorMessage = error.message || 'An unknown error occurred while processing with the AI.';
                alert(`حدث خطأ أثناء تحليل الملف عبر المساعد: ${fileName}\n\nالتفاصيل: ${errorMessage}`);
            } finally {
                setParsingFiles(prev => prev.filter(name => name !== fileName));
            }
        };
        
        reader.onerror = () => {
            const errorDetails = reader.error?.message || 'Unknown file reading error.';
            console.error(`Error reading file ${fileName}:`, reader.error);
            alert(`حدث خطأ أثناء قراءة الملف: ${fileName}\n\nالتفاصيل: ${errorDetails}`);
            setParsingFiles(prev => prev.filter(name => name !== fileName));
        };
        
        reader.readAsDataURL(file);
    }, [processedFiles, parsingFiles]);

    const handleFileSelection = (files: FileList | null) => {
        if (files) {
            Array.from(files).forEach(processFile);
        }
    };

    const handleRemoveFile = (fileNameToRemove: string) => {
        setProcessedFiles(prev => prev.filter(file => file.name !== fileNameToRemove));
    };

    const handleDownloadAndShowInstructions = () => {
        const allFileNames = processedFiles.map(file => file.name);
        const allChunks = processedFiles.flatMap(file => 
            file.text.split(/\n\s*\n+/)
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 20)
        );

        if (allChunks.length === 0) {
            alert('لم يتم استخلاص أي محتوى صالح من الملفات. يرجى التأكد من أن الملفات تحتوي على نص.');
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
        
        setShowInstructions(true);
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
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={parsingFiles.length > 0}
                    />
                </div>

                {parsingFiles.length > 0 && (
                    <div className="text-center text-sm text-stone-700 animate-pulse">
                        جاري تحليل: {parsingFiles.join(', ')}... (قد يستغرق هذا بعض الوقت)
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
                        onClick={handleDownloadAndShowInstructions}
                        className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 bg-wavy-gold-button text-black focus:ring-amber-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={parsingFiles.length > 0 || processedFiles.length === 0}
                    >
                        <CheckCircleIcon />
                        <span>تنزيل ملف المعرفة</span>
                    </button>
                </div>
            </div>
            
            {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
        </div>
    );
};