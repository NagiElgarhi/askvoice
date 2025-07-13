import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Knowledge } from '../types';

const API_KEY_STORAGE_KEY = 'google-ai-api-key';

const getApiKey = (): string => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return storedKey || process.env.API_KEY || "";
}

export const extractTextFromData = async (base64Data: string, mimeType: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("لم يتم تكوين مفتاح API. يرجى إضافته عبر أيقونة المفتاح.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const filePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    };

    const textPart = {
        text: "Extract all text content from the provided document. Respond only with the extracted text, without any additional comments, introductions, or summaries."
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [filePart, textPart] }
    });
    
    return response.text;
};


const BASE_SYSTEM_INSTRUCTION = `
أنت مساعد ذكي لأطباء نقابة القاهرة. مهمتك هي الرد على استفسارات الأطباء بدقة واحترافية بناءً على قاعدة المعرفة المتوفرة لديك.

يجب أن تكون ردودك:
1.  **دقيقة وموثوقة**: استند فقط إلى المعلومات الموجودة في قاعدة المعرفة. إذا كانت المعلومة غير موجودة، أجب بوضوح "لا أملك معلومات حول هذا الموضوع في قاعدة بياناتي".
2.  **احترافية ومنظمة**: استخدم لغة واضحة ومباشرة.
3.  **باللغة العربية الفصحى**: تحدث بلغة عربية سليمة وواضحة.

**قواعد صارمة لتنسيق الإخراج:**
- يجب عليك تنسيق ردك بالكامل ككائن JSON واحد يلتزم بشكل صارم بالمخطط المحدد.
- إذا كان سؤال المستخدم يمكن الإجابة عليه في كتلة نصية واحدة، فيجب أن تحتوي مصفوفة "answer" على عنصر واحد فقط.
- إذا كانت الإجابة تحتوي على أجزاء مميزة متعددة (مثل قائمة خطوات، خيارات مختلفة)، فقم بتقسيمها إلى سلاسل نصية متعددة في مصفوفة "answer".
- قدم دائمًا 3-4 أسئلة متابعة مقترحة قد يطرحها المستخدم.
- يجب أن يكون "spoken_summary" موجزًا ومناسبًا للقراءة بصوت عالٍ. إذا كانت الإجابة متعددة الأجزاء، فيجب أن يكون "spoken_summary" مقدمة موجزة، مثل: 'تتكون العملية من ثلاث خطوات رئيسية. الخطوة الأولى هي... يمكنك رؤية الخطوات الأخرى على الشاشة.'
`;

const getAugmentedSystemInstruction = async (): Promise<string> => {
    try {
        const response = await fetch('/knowledge.json');
        if (!response.ok) {
            console.error("Failed to fetch knowledge.json, using base instruction.");
            return BASE_SYSTEM_INSTRUCTION;
        }

        const data: Knowledge = await response.json();
        let knowledgePreamble = "--- بداية قاعدة المعرفة ---\n";
        knowledgePreamble += "استخدم المعلومات التالية بصرامة كمصدر وحيد للإجابة على أسئلة المستخدم. إذا لم تكن المعلومات المطلوبة موجودة هنا، فأخبر المستخدم بأنك لا تملك هذه المعلومة.\n\n";

        let hasKnowledge = false;
        
        if (data.texts?.length > 0) {
            hasKnowledge = true;
            knowledgePreamble += "معلومات نصية:\n" + data.texts.join('\n---\n') + "\n\n";
        }
        
        if (data.files?.length > 0) {
            hasKnowledge = true;
            knowledgePreamble += `تم استخلاص المعلومات من الملفات التالية التي تم تحميلها:\n` + data.files.join(', ') + `\n\n`;
        }

        const urlContents = data.urls?.filter(u => u.content).map(u => `محتوى من رابط ${u.url}:\n${u.content}`);
        if (urlContents?.length > 0) {
            hasKnowledge = true;
            knowledgePreamble += "محتوى من روابط:\n" + urlContents.join('\n---\n') + "\n\n";
        }


        knowledgePreamble += "--- نهاية قاعدة المعرفة ---\n\n";

        if (hasKnowledge) {
            return knowledgePreamble + BASE_SYSTEM_INSTRUCTION;
        }

    } catch (error) {
        console.error("Failed to read or parse knowledge.json:", error);
    }
    
    return BASE_SYSTEM_INSTRUCTION;
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.ARRAY,
            description: "قائمة من السلاسل النصية، حيث يمثل كل سلسلة جزءًا من الإجابة. إذا كانت الإجابة قصيرة وتتكون من جزء واحد، فستكون هذه مصفوفة بسلسلة نصية واحدة.",
            items: { type: Type.STRING }
        },
        spoken_summary: {
            type: Type.STRING,
            description: "ملخص موجز للإجابة ليتم قراءته بصوت عالٍ."
        },
        suggested_questions: {
            type: Type.ARRAY,
            description: "قائمة من 3-4 أسئلة متابعة مقترحة قد يطرحها المستخدم.",
            items: { type: Type.STRING }
        }
    },
    required: ["answer", "spoken_summary", "suggested_questions"]
};


export const createChatSession = async (): Promise<Chat> => {
  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("API key is not available.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const systemInstruction = await getAugmentedSystemInstruction();

  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  });
  return chat;
};