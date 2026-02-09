import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { ChatMessage, UserProfile } from '../types';

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
            text: `${SYSTEM_INSTRUCTION}\n\nTask: Identify this medication (pill/package). Explain dosage and usage simply for an elderly person.\nUser Question: ${userPrompt}`
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

export const analyzeFoodImage = async (
  base64Image: string,
  userProfile: UserProfile
): Promise<string> => {
  try {
    const modelId = 'gemini-3-flash-preview';

    const prompt = `
      Role: Nutritionist for elderly patient.
      Patient Profile: Age ${userProfile.age}, Conditions: ${userProfile.condition}.
      Task: Identify the food in the image. Analyze if it is safe for the patient to eat based on their conditions (e.g. Sodium/Sugar levels).
      
      Format:
      1. Name of food.
      2. Verdict: (safe to eat / eat in moderation / should avoid). Use emojis (✅/⚠️/❌).
      3. Explanation: Simple reason why (e.g. "Too salty for high blood pressure").
      4. Nutrition Tip: A short health tip.
      
      Tone: Polite, caring Thai language.
    `;

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
            text: prompt
          }
        ]
      }
    });

    return response.text || "วิเคราะห์อาหารไม่ได้ค่ะ";
  } catch (error) {
    console.error("Gemini Food Error:", error);
    return "ขออภัยค่ะ ไม่สามารถวิเคราะห์อาหารได้ในขณะนี้";
  }
};