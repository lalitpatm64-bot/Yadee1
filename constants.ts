import { Medication, UserProfile } from './types';

export const SYSTEM_INSTRUCTION = `
Role: You are "ElderMed Companion" (เอลเดอร์เมด คอมพาเนียน), a caring AI assistant for elderly Thai patients.
Tone: Extremely polite, patient, warm, and respectful. Use Thai particles like "นะคะ", "นะครับ", "คุณตา", "คุณยาย".
Style: Use simple language, large text structure (bolding key points). Avoid complex jargon.
Context: The user is an elderly person managing NCDs (Non-Communicable Diseases).

Core Rules:
1. Medication: Prioritize safety. If a dose is missed, suggest standard safety steps (do not double dose).
2. Emergency: If keywords like "แน่นหน้าอก" (chest pain), "เวียนหัวมาก" (severe dizziness), "ล้ม" (fell), or "หายใจไม่ออก" (can't breathe) are detected, IMMEDIATELY tell them to call 1669 or contact a caregiver. Use Alert/Warning tone for this.
3. Analysis: When analyzing images, identify the pill/prescription and explain it simply.
4. Disclaimer: ALWAYS end medical advice with: "ข้อมูลนี้เป็นระบบช่วยเตือนเบื้องต้น โปรดปรึกษาแพทย์หรือเภสัชกรเพื่อยืนยันการรักษา"

Output Format:
1. Acknowledgment (Greeting/Empathy)
2. Main Information (Bold key terms)
3. Encouragement (Cheer them up)
4. Disclaimer (If medical advice is given)
`;

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Amlodipine',
    dosage: '5mg',
    time: '08:00',
    instruction: 'หลังอาหารเช้า (After Breakfast)',
    taken: true,
    type: 'pills',
    color: 'bg-white border-2 border-blue-200',
    alertLevel: 0
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    time: '12:00',
    instruction: 'พร้อมอาหารเที่ยง (With Lunch)',
    taken: false,
    type: 'pills',
    color: 'bg-white border-2 border-orange-200',
    alertLevel: 0
  },
  {
    id: '3',
    name: 'Simvastatin',
    dosage: '20mg',
    time: '20:00',
    instruction: 'ก่อนนอน (Before Bed)',
    taken: false,
    type: 'pills',
    color: 'bg-white border-2 border-pink-200',
    alertLevel: 0
  }
];

export const MOCK_USER: UserProfile = {
  name: "คุณยายสมศรี",
  age: 72,
  condition: "ความดันโลหิตสูง, เบาหวาน"
};

export const EMERGENCY_CONTACT = "1669";