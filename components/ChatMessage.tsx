
import React from 'react';
import { Message } from '../types';
import { UserIcon, BotIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.speaker === 'user';

  return (
    <div className={`flex items-start gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center shadow-md text-white">
          <BotIcon />
        </div>
      )}
      <div
        className={`max-w-sm sm:max-w-md lg:max-w-2xl p-4 rounded-2xl shadow-lg ${
          isUser
            ? 'bg-sky-700 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <p className="text-base leading-relaxed">{message.text}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center shadow-md text-white">
          <UserIcon />
        </div>
      )}
    </div>
  );
};