
export enum Status {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface Message {
  speaker: 'user' | 'ai';
  // A user message will only have `text`.
  text?: string; 
  // An AI message will have the following properties.
  textParts?: string[];
  spokenSummary?: string;
  suggestedQuestions?: string[];
}


export interface Knowledge {
  texts: string[];
  urls: { url: string; content: string | null }[];
  files: { name: string; content: string }[];
}