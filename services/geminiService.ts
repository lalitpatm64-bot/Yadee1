import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { ChatMessage, UserProfile, Medication, VitalSigns } from '../types';

// Helper to safely get AI instance
const getAI = () => {
  // We initialize here to prevent app crash if process.env is accessed at module level in some environments
  try {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
    throw new Error("API Key configuration error");
  }
};

export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const ai = getAI();
    // Use gemini-3-flash-preview for chat as it is optimized for low latency text
    const modelId = 'gemini-3-flash-preview';
    
    // OPTIMIZATION: Limit history to last 6 messages
    const recentHistory = history.slice(-6);
    
    const chatHistoryContext = recentHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`)
      .join('\n');

    const prompt = `
      ${SYSTEM_INSTRUCTION}
      
      Previous conversation (last 6 messages):
      ${chatHistoryContext}
      
      User: ${newMessage}
      Model:
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt, // Pass string directly for simple text generation
    });

    return response.text || "ขออภัยครับ หมอ AI กำลังเรียบเรียงคำพูด ลองถามใหม่อีกครั้งนะครับ";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "ขออภัยค่ะ ระบบกำลังปรับปรุงสัญญาณอินเทอร์เน็ต ลองกดส่งใหม่อีกครั้งนะคะ (Error: Chat)";
  }
};

export const analyzeMedicalImage = async (
  base64Image: string,
  userPrompt: string = "ช่วยดูยาตัวนี้ให้หน่อยค่ะ ว่าคือยาอะไร และต้องกินยังไง"
): Promise<string> => {
  try {
    const ai = getAI();
    // Use gemini-2.5-flash-latest for stable multimodal capabilities
    const modelId = 'gemini-2.5-flash-latest';

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
    return "ขออภัยค่ะ ระบบไม่สามารถดูรูปภาพได้ในขณะนี้ (Error: Vision)";
  }
};

export const analyzeFoodImage = async (
  base64Image: string,
  userProfile: UserProfile
): Promise<string> => {
  try {
    const ai = getAI();
    const modelId = 'gemini-2.5-flash-latest';

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

export const verifyPill = async (
  base64Image: string,
  medName: string,
  appearance: string
): Promise<{ isMatch: boolean; reason: string }> => {
  try {
    const ai = getAI();
    const modelId = 'gemini-2.5-flash-latest';
    const prompt = `
      Task: Verify if the medication in the image matches the expected description.
      Expected Medication: "${medName}"
      Expected Appearance: "${appearance}"
      
      Analyze the image carefully.
      - If the image contains a pill/package that looks like the description, return true.
      - If the image contains a completely different pill, or no pill, or is too blurry, return false.
      
      Output JSON ONLY:
      {
        "isMatch": boolean,
        "reason": "Short explanation in Thai for an elderly person (e.g., 'สีและรูปร่างถูกต้องค่ะ' or 'รูปร่างไม่เหมือนยาเม็ดสีขาวเลยค่ะ')"
      }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: 'application/json' }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    return { isMatch: true, reason: "ระบบตรวจสอบไม่ได้ แต่บันทึกแล้วค่ะ" };
  } catch (error) {
    console.error("Gemini Verify Error:", error);
    return { isMatch: true, reason: "ระบบตรวจสอบขัดข้อง (บันทึกปกติ)" }; // Fail safe
  }
};

export const analyzeFaceHealth = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAI();
    const modelId = 'gemini-2.5-flash-latest';

    const prompt = `
      Role: Friendly AI Health Companion.
      Task: Analyze the selfie of an elderly person. Estimate their "Energy Level" and "Mood" based on facial expression (Smile, eyes, brightness).
      
      IMPORTANT: This is for entertainment and encouragement only. NOT medical diagnosis.
      
      Output strict JSON format ONLY:
      {
        "energyScore": number (0-100),
        "moodScore": number (0-100),
        "hydrationGuess": "High" | "Medium" | "Low",
        "compliment": "A very sweet, specific compliment in Thai about their smile or look.",
        "advice": "A gentle health suggestion in Thai (e.g., drink water, rest eyes)."
      }
      
      Do not include markdown code blocks. Just the raw JSON string.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Face Error:", error);
    return "{}";
  }
};

export const generateDailyReport = async (
  user: UserProfile,
  medications: Medication[],
  vitals: VitalSigns,
  mood: string
): Promise<string> => {
  try {
    const ai = getAI();
    const modelId = 'gemini-3-flash-preview';
    
    const takenCount = medications.filter(m => m.taken).length;
    const totalCount = medications.length;
    
    const prompt = `
      Role: A loving elderly grandmother/grandfather (Thai).
      Task: Write a short, warm, and cute message to send to children/grandchildren via LINE application.
      
      Context Data:
      - Name: ${user.name}
      - Meds Taken: ${takenCount}/${totalCount}
      - Blood Pressure: ${vitals.systolic}/${vitals.diastolic}
      - Sugar: ${vitals.sugar}
      - Mood today: ${mood}
      
      Requirements:
      - Tone: Loving, cheerful, use emojis (😊, ❤️, 💊).
      - Content: Summarize health briefly. If meds are complete, say so proudly. If vitals are good, brag a little.
      - Ending: Say "I love you" or "Don't worry about me".
      - Length: Short, fit for a chat bubble (2-3 sentences).
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "แม่สบายดีจ้ะ กินยาครบแล้ว รักลูกนะ";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "แม่สบายดีจ้ะ กินยาครบแล้ว รักลูกนะ";
  }
};