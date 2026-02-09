import React, { useEffect, useState, useRef } from 'react';
import { Medication } from '../types';
import { Bell, User, Users, Phone, X, CheckCircle, Clock, Volume2, VolumeX } from 'lucide-react';

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
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    // Sound: A gentle but clear repeating bell/alarm
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Audio Playback based on Alert State
  useEffect(() => {
    if (activeAlert && audioRef.current && !isMuted) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio playback blocked:", error);
        });
      }
    } else if ((!activeAlert || isMuted) && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [activeAlert, isMuted]);

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

        // Logic: Only trigger if the diff is positive (it's past time) and within a reasonable window
        if (diffMinutes >= 0 && diffMinutes < 60) {
            let newLevel: 0 | 1 | 2 | 3 = med.alertLevel || 0;

            // Check if we need to escalate or trigger alert
            // We only trigger if the level changes to a higher state or if it's a new alert (level 0 -> 1)
            
            let triggeredStage: 1 | 2 | 3 | null = null;

            if (diffMinutes >= 0 && diffMinutes < 10 && newLevel < 1) {
                newLevel = 1;
                triggeredStage = 1;
            }
            else if (diffMinutes >= 10 && diffMinutes < 20 && newLevel < 2) {
                newLevel = 2;
                triggeredStage = 2;
            }
            else if (diffMinutes >= 20 && newLevel < 3) {
                newLevel = 3;
                triggeredStage = 3;
            }

            if (triggeredStage) {
                setActiveAlert({ medId: med.id, medName: med.name, stage: triggeredStage });
                onUpdateMedication(med.id, { alertLevel: newLevel });
                setIsMuted(false); // Reset mute when new alert comes
            }
        }
      });
    };

    const interval = setInterval(checkMedications, 2000);
    return () => clearInterval(interval);
  }, [medications, onUpdateMedication]);

  if (!activeAlert) return null;

  // UI Configuration based on stage
  const config = {
    1: {
      gradient: 'from-pink-400 to-pink-600',
      icon: <Bell size={80} className="text-white animate-[bounce_1s_infinite]" />,
      title: 'ได้เวลาทานยาแล้วค่ะ',
      subtitle: 'อย่าลืมทานยานะคะ จะได้แข็งแรง',
      actionText: 'ทานเรียบร้อยแล้ว',
      textColor: 'text-white'
    },
    2: {
      gradient: 'from-orange-400 to-orange-600',
      icon: <Users size={80} className="text-white animate-pulse" />,
      title: 'ยังไม่ได้ทานยาใช่ไหมคะ?',
      subtitle: 'ระบบกำลังแจ้งเตือนลูกหลานให้ทราบ',
      actionText: 'ทานยาเดี๋ยวนี้',
      textColor: 'text-white'
    },
    3: {
      gradient: 'from-red-500 to-red-700',
      icon: <Phone size={80} className="text-white animate-[shake_0.5s_infinite]" />,
      title: '⚠️ แจ้งเตือนด่วน!',
      subtitle: 'เลยเวลามานานแล้ว ระบบแจ้งฉุกเฉินแล้ว',
      actionText: 'รับทราบ / กำลังทาน',
      textColor: 'text-white'
    }
  }[activeAlert.stage];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in safe-bottom bg-white">
      
      {/* Background with Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} opacity-90`} />
      
      {/* Mute Button (Top Right) */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-20 bg-white/20 p-3 rounded-full backdrop-blur-md text-white hover:bg-white/30 transition-colors"
      >
        {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} className="animate-pulse" />}
      </button>

      {/* Decorative Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-75" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8 text-center space-y-8">
        
        {/* Icon Container */}
        <div className="bg-white/20 p-8 rounded-full shadow-2xl backdrop-blur-sm ring-4 ring-white/30">
            {config.icon}
        </div>

        {/* Texts */}
        <div className="space-y-2">
            <h2 className={`text-4xl font-bold ${config.textColor} drop-shadow-md`}>
                {config.title}
            </h2>
            <p className={`text-xl ${config.textColor} opacity-90 font-medium`}>
                {config.subtitle}
            </p>
        </div>

        {/* Medicine Card */}
        <div className="bg-white/95 w-full p-6 rounded-3xl shadow-xl transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-bold flex items-center">
                    <Clock size={18} className="mr-1" /> ตอนนี้
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-bold">
                    ยังไม่ทาน
                </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 text-left mb-1">
                {activeAlert.medName}
            </h3>
            <p className="text-slate-500 text-left text-lg">
                กรุณาทานตามที่หมอสั่งนะคะ
            </p>
        </div>

        {/* Action Button */}
        <button 
             onClick={() => {
                onTakeMedication(activeAlert.medId);
                setActiveAlert(null);
             }}
             className="w-full bg-white text-pink-600 py-5 rounded-full text-2xl font-bold shadow-2xl active:scale-95 transition-all flex items-center justify-center ring-4 ring-white/50 hover:bg-pink-50"
        >
             <CheckCircle className="mr-3" size={32} />
             {config.actionText}
        </button>

        {/* Close / Snooze */}
        <button 
             onClick={() => setActiveAlert(null)}
             className="text-white/80 text-lg underline font-medium hover:text-white"
        >
             ปิดหน้าต่าง (ขออีก 5 นาที)
        </button>

      </div>
    </div>
  );
};

export default SafetyNetSystem;