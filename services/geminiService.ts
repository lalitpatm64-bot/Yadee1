import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { ChatMessage } from '../types';

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    // Using gemini-3-flash-preview for fast, responsive text interactions
    const modelId = 'gemini-3-flash-preview';
    
    const chatHistoryContext = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
      .join('\n');

    const prompt = `
      ${SYSTEM_INSTRUCTION}
      
      Previous conversation:
      ${chatHistoryContext}
      
      User: ${newMessage}
      Model:
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "ขออภัยครับ ระบบขัดข้องชั่วคราว (System Error)";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "ขออภัยค่ะ มีปัญหาในการเชื่อมต่อ โปรดลองใหม่อีกครั้งนะคะ";
  }
};

export const analyzeMedicalImage = async (
  base64Image: string,
  userPrompt: string = "ช่วยดูยาตัวนี้ให้หน่อยค่ะ ว่าคือยาอะไร และต้องกินยังไง"
): Promise<string> => {
  try {
    // Using gemini-3-flash-preview for multimodal (image + text) understanding.
    // It is fast and capable of recognizing pills and text.
    const modelId = 'gemini-3-flash-preview';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `${SYSTEM_INSTRUCTION}\n\nUser Question: ${userPrompt}\nIdentify this medication and provide instructions.`
          }
        ]
      }
    });

    return response.text || "ไม่สามารถวิเคราะห์รูปภาพได้ค่ะ ลองถ่ายใหม่ให้ชัดขึ้นนะคะ";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "ขออภัยค่ะ ระบบไม่สามารถดูรูปภาพได้ในขณะนี้";
  }
};