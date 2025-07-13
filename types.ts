
export enum Status {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface Message {
  speaker: 'user' | 'ai';
  text: string;
}

export interface Knowledge {
  texts: string[];
  urls: { url: string; content: string | null }[];
  files: { name: string; content: string }[];
}
