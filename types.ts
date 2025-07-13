
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
  urls: string[];
  files: string[];
}
