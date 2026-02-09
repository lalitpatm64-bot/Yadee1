export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g., "08:00"
  instruction: string; // e.g., "Take after meal"
  taken: boolean;
  type: 'pills' | 'liquid' | 'injection';
  color?: string;
  alertLevel?: 0 | 1 | 2 | 3; // 0=None, 1=User, 2=Caregiver, 3=Emergency
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isEmergency?: boolean;
  timestamp: Date;
}

export interface HealthMetric {
  date: string;
  value: number;
  label: string;
}

export type ViewState = 'home' | 'chat' | 'scan' | 'profile';

export interface UserProfile {
  name: string;
  age: number;
  condition: string;
}