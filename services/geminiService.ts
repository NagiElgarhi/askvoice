
import { GoogleGenAI, Chat } from "@google/genai";
import { Knowledge } from '../types';

const API_KEY_LOCAL_STORAGE_KEY = 'google_api_key';

const getApiKey = (): string => {
    try {
        const storedKey = localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY);
        return storedKey || process.env.API_KEY || "";
    } catch (e) {
        console.warn("Could not access localStorage. Falling back to environment variables.");
        return process.env.API_KEY || "";
    }
}

const BASE_SYSTEM_INSTRUCTION = `
أنت مساعد ذكي لأطباء نقابة القاهرة. مهمتك هي الرد على استفسارات الأطباء بدقة واحترافية بناءً على قاعدة المعرفة المتوفرة لديك.
يجب أن تكون ردودك:
1.  **دقيقة وموثوقة**: استند فقط إلى المعلومات الموجودة في قاعدة المعرفة. إذا كانت المعلومة غير موجودة، أجب بوضوح "لا أملك معلومات حول هذا الموضوع في قاعدة بياناتي".
2.  **احترافية وموجزة**: استخدم لغة واضحة ومباشرة ومناسبة للمهنيين الطبيين.
3.  **باللغة العربية الفصحى**: تحدث بلغة عربية سليمة وواضحة.
لا تبدأ ردك بـ "بالتأكيد" أو "بالطبع". انتقل مباشرة إلى الإجابة المفيدة.
`;

const KNOWLEDGE_KEY = 'agent_knowledge_base';

const getAugmentedSystemInstruction = (): string => {
    try {
        const storedKnowledge = localStorage.getItem(KNOWLEDGE_KEY);
        if (!storedKnowledge) {
            return BASE_SYSTEM_INSTRUCTION;
        }

        const data: Knowledge = JSON.parse(storedKnowledge);
        let knowledgePreamble = "--- بداية قاعدة المعرفة ---\n";
        knowledgePreamble += "استخدم المعلومات التالية بصرامة كمصدر وحيد للإجابة على أسئلة المستخدم. إذا لم تكن المعلومات المطلوبة موجودة هنا، فأخبر المستخدم بأنك لا تملك هذه المعلومة.\n\n";

        let hasKnowledge = false;
        if (data.texts?.length > 0) {
            knowledgePreamble += "معلومات نصية:\n" + data.texts.join('\n---\n') + "\n\n";
            hasKnowledge = true;
        }
        if (data.urls?.length > 0) {
            knowledgePreamble += "روابط مرجعية (افترض أن محتواها معروف لديك):\n" + data.urls.join('\n') + "\n\n";
            hasKnowledge = true;
        }
        if (data.files?.length > 0) {
            knowledgePreamble += "ملفات مرجعية (افترض أن محتواها معروف لديك):\n" + data.files.join('\n') + "\n\n";
            hasKnowledge = true;
        }

        knowledgePreamble += "--- نهاية قاعدة المعرفة ---\n\n";

        if (hasKnowledge) {
            return knowledgePreamble + BASE_SYSTEM_INSTRUCTION;
        }

    } catch (error) {
        console.error("Failed to read knowledge base from localStorage:", error);
    }
    
    return BASE_SYSTEM_INSTRUCTION;
};


export const createChatSession = (): Chat => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const systemInstruction = getAugmentedSystemInstruction();

  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
  return chat;
};
