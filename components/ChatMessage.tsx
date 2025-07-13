
import React, { useState } from 'react';
import { Message } from '../types';
import { UserIcon, BotIcon, ClipboardIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onSuggestedQuestionClick?: (question: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestedQuestionClick }) => {
  const isUser = message.speaker === 'user';
  const [copied, setCopied] = useState(false);
  const [currentPart, setCurrentPart] = useState(0);

  const textParts = message.textParts || [];
  const hasMultipleParts = textParts.length > 1;

  const currentText = isUser ? message.text : (textParts[currentPart] || '');

  const handleCopy = () => {
    if (copied || !currentText) return;
    navigator.clipboard.writeText(currentText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const goToNext = () => setCurrentPart(p => (p + 1) % textParts.length);
  const goToPrev = () => setCurrentPart(p => (p - 1 + textParts.length) % textParts.length);

  return (
    <div className={`flex items-start gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center shadow-md text-white">
          <BotIcon />
        </div>
      )}
      <div
        className={`relative max-w-sm sm:max-w-md lg:max-w-2xl p-4 rounded-2xl shadow-lg flex flex-col ${
          isUser
            ? 'bg-amber-900 text-white rounded-br-none'
            : 'bg-amber-700 text-amber-50 rounded-bl-none'
        }`}
      >
        {/* Main Content */}
        <div className="relative">
            {hasMultipleParts && (
                 <button 
                    onClick={goToPrev} 
                    className="absolute right-full mr-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-black transition-all"
                    aria-label="Previous"
                 >
                     <ChevronRightIcon className="w-5 h-5" />
                 </button>
            )}
            <p className="text-base leading-relaxed whitespace-pre-wrap">{currentText}</p>
            {hasMultipleParts && (
                 <button 
                    onClick={goToNext} 
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-black transition-all"
                    aria-label="Next"
                 >
                     <ChevronLeftIcon className="w-5 h-5" />
                 </button>
            )}
        </div>

        {/* Footer for AI messages */}
        {!isUser && (
            <div className="mt-3 pt-2 border-t border-amber-200/20">
                <div className="flex justify-between items-center text-xs">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 p-1 rounded-full text-amber-200/80 hover:text-white hover:bg-black/20 transition-all duration-200"
                        aria-label={copied ? "تم النسخ!" : "نسخ النص"}
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                        <span className={`transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>تم!</span>
                    </button>
                     {hasMultipleParts && (
                        <div className="font-mono text-amber-200/70 select-none">
                            {currentPart + 1} / {textParts.length}
                        </div>
                    )}
                </div>

                {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestedQuestionClick?.(q)}
                                className="px-3 py-1.5 text-sm bg-black/10 text-amber-50 rounded-full hover:bg-black/20 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-600 flex items-center justify-center shadow-md text-white">
          <UserIcon />
        </div>
      )}
    </div>
  );
};