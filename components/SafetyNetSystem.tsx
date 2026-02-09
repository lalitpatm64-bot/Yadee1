import React, { useEffect, useState } from 'react';
import { Medication } from '../types';
import { Bell, User, Users, Phone, X, CheckCircle } from 'lucide-react';

interface Props {
  medications: Medication[];
  onUpdateMedication: (id: string, updates: Partial<Medication>) => void;
  onTakeMedication: (id: string) => void;
}

interface ActiveAlert {
  medId: string;
  medName: string;
  stage: 1 | 2 | 3; // 1=User, 2=Caregiver, 3=Emergency
}

const SafetyNetSystem: React.FC<Props> = ({ medications, onUpdateMedication, onTakeMedication }) => {
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);

  // Play sound effect
  const playSound = (stage: number) => {
    try {
      // Using a simple beep sound URL (Standard open source sound or generated)
      // For this demo, we use a gentle chime for stage 1, and more urgent for 3
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
      if (stage === 3) {
         audio.playbackRate = 1.5; // Faster/Urgent
      }
      audio.play().catch(e => console.log("Audio play blocked until user interaction"));
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    const checkMedications = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      medications.forEach(med => {
        if (med.taken) return;

        const [h, m] = med.time.split(':').map(Number);
        const medTimeInMinutes = h * 60 + m;
        const diffMinutes = currentTimeInMinutes - medTimeInMinutes;

        // Logic: Only trigger if the diff is positive (it's past time) and within a reasonable window (e.g., < 60 mins) to avoid alerting for very old missed doses repeatedly in this demo logic
        if (diffMinutes >= 0 && diffMinutes < 60) {
            let newLevel: 0 | 1 | 2 | 3 = med.alertLevel || 0;

            // Stage 1: 0-9 minutes past due
            if (diffMinutes >= 0 && diffMinutes < 10 && newLevel < 1) {
                newLevel = 1;
                setActiveAlert({ medId: med.id, medName: med.name, stage: 1 });
                playSound(1);
            }
            // Stage 2: 10-19 minutes past due
            else if (diffMinutes >= 10 && diffMinutes < 20 && newLevel < 2) {
                newLevel = 2;
                setActiveAlert({ medId: med.id, medName: med.name, stage: 2 });
                playSound(2);
            }
            // Stage 3: 20+ minutes past due
            else if (diffMinutes >= 20 && newLevel < 3) {
                newLevel = 3;
                setActiveAlert({ medId: med.id, medName: med.name, stage: 3 });
                playSound(3);
            }

            if (newLevel !== med.alertLevel) {
                onUpdateMedication(med.id, { alertLevel: newLevel });
            }
        }
      });
    };

    // Check every 10 seconds for demo purposes (real app might be 1 min)
    const interval = setInterval(checkMedications, 10000);
    return () => clearInterval(interval);
  }, [medications, onUpdateMedication]);

  if (!activeAlert) return null;

  // UI Configuration based on stage
  const config = {
    1: {
      color: 'bg-teal-600',
      icon: <Bell size={48} className="text-white animate-bounce" />,
      title: 'ได้เวลาทานยาแล้วนะคะ',
      subtitle: 'ระบบเตือนคุณยาย',
      actionText: 'ทานแล้วค่ะ',
      bg: 'bg-teal-50',
      border: 'border-teal-200'
    },
    2: {
      color: 'bg-orange-500',
      icon: <Users size={48} className="text-white animate-pulse" />,
      title: 'ยังไม่ได้ทานยาใช่ไหมคะ?',
      subtitle: 'ระบบแจ้งเตือนคนดูแล (Caregiver Alert)',
      actionText: 'ทานยาเรียบร้อย',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    3: {
      color: 'bg-red-600',
      icon: <Phone size={48} className="text-white animate-shake" />,
      title: '⚠️ แจ้งเตือนด่วน!',
      subtitle: 'เลยเวลามา 20 นาทีแล้ว ระบบกำลังแจ้งลูกหลาน',
      actionText: 'ทราบแล้ว/กำลังทาน',
      bg: 'bg-red-50',
      border: 'border-red-200'
    }
  }[activeAlert.stage];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in safe-bottom p-4">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${config.bg} border-4 ${config.border}`}>
        {/* Header */}
        <div className={`${config.color} p-6 flex flex-col items-center justify-center text-center space-y-2`}>
           {config.icon}
           <h2 className="text-2xl font-bold text-white">{config.title}</h2>
           <p className="text-white/90 text-sm">{config.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
           <div className="text-center">
             <p className="text-slate-500 text-lg">รายการยา:</p>
             <h3 className="text-3xl font-bold text-slate-800">{activeAlert.medName}</h3>
           </div>

           {/* Special Message for Stage 3 */}
           {activeAlert.stage === 3 && (
             <div className="bg-red-100 p-3 rounded-xl flex items-center space-x-2 text-red-800 text-sm">
                <Phone size={16} />
                <span>ส่งไลน์แจ้งลูกสาวเรียบร้อยแล้ว...</span>
             </div>
           )}

           <button 
             onClick={() => {
                onTakeMedication(activeAlert.medId);
                setActiveAlert(null);
             }}
             className={`w-full py-4 rounded-xl text-xl font-bold text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center ${config.color}`}
           >
             <CheckCircle className="mr-2" size={24} />
             {config.actionText}
           </button>

           <button 
             onClick={() => setActiveAlert(null)}
             className="w-full py-3 text-slate-400 font-medium text-lg"
           >
             ปิดหน้าต่าง (ยังไม่ทาน)
           </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyNetSystem;