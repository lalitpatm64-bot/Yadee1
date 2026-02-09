export interface Medication {
  id: string;
  name: string; // Scientific name
  commonName?: string; // User-friendly name e.g. "ยาเบาหวาน"
  appearance?: string; // Description e.g. "เม็ดสีขาว"
  dosage: string;
  time: string; // e.g., "08:00"
  instruction: string; // e.g., "Take after meal"
  taken: boolean;
  type: 'pills' | 'liquid' | 'injection';
  color?: string;
  alertLevel?: 0 | 1 | 2 | 3; // 0=None, 1=User, 2=Caregiver, 3=Emergency
  customAlertVoice?: string; // URL/Blob for specific medication alert
  totalQuantity?: number; // Remaining stock
  reorderThreshold?: number; // Notify when stock falls below this
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

export interface VitalSigns {
  systolic: number; // Pressure High (e.g. 120)
  diastolic: number; // Pressure Low (e.g. 80)
  sugar: number; // mg/dL
  lastUpdated: Date;
}

export interface GardenState {
  level: number; // 1 = Seed, 2 = Sprout, 3 = Sapling, 4 = Tree, 5 = Blooming
  waterPoints: number; // 0-100 to next level
  totalPlantsGrown: number;
}

export type ViewState = 'home' | 'chat' | 'scan' | 'profile' | 'garden';

export interface UserProfile {
  name: string;
  age: number;
  condition: string;
  wakeUpTime?: string; // e.g., "06:00"
}