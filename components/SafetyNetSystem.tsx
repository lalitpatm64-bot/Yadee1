import React, { useEffect, useState, useRef } from 'react';
import { Medication } from '../types';
import { Bell, User, Users, Phone, X, CheckCircle, Clock, Volume2, VolumeX, AlertTriangle, Siren, Coffee, Hourglass } from 'lucide-react';

interface Props {
  medications: Medication[];
  onUpdateMedication: (id: string, updates: Partial<Medication>) => void;
  onTakeMedication: (id: string) => void;
  customVoiceUrl?: string | null;
}

interface ActiveAlert {
  medId: string;
  medName: string;
  commonName?: string;
  appearance?: string;
  instruction?: string;
  stage: 0 | 1 | 2 | 3; // 0=Pre-alert (-10min), 1=15min, 2=30min, 3=60min
  customVoice?: string;
}

const SafetyNetSystem: React.FC<Props> = ({ medications, onUpdateMedication, onTakeMedication, customVoiceUrl }) => {
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  const isComponentMounted = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
        isComponentMounted.current = false;
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, []);

  // Audio Playback / TTS Logic
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const playAudio = () => {
        if (!activeAlert || isMuted || !isComponentMounted.current) return;

        // Clean up previous playback
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        const specificVoice = activeAlert.customVoice;
        const globalVoice = customVoiceUrl;
        
        // Priority 1: Specific Medication Voice (Only for late alerts, usually users record "Take medicine now")
        // For Stage 0 (Pre-alert), we might prefer TTS or a specific logic unless user recorded a "Preparation" voice.
        // Assuming user recorded voice is "Go take medicine", using it for pre-alert might be too aggressive? 
        // Let's use TTS for Stage 0 primarily unless we add a specific "Pre-alert voice" feature later.
        if (specificVoice && activeAlert.stage > 0) {
            const audio = new Audio(specificVoice);
            audioRef.current = audio;
            audio.play().catch(e => console.error("Specific audio playback failed:", e));
            audio.onended = () => {
                 if (activeAlert && !isMuted && isComponentMounted.current) {
                    timeoutId = setTimeout(() => playAudio(), 3000);
                }
            };
            return;
        }
        
        // Priority 2: Global Profile Voice (Only for late alerts)
        if (globalVoice && activeAlert.stage > 0) {
            const audio = new Audio(globalVoice);
            audioRef.current = audio;
            audio.play().catch(e => console.error("Global audio playback failed:", e));
            audio.onended = () => {
                 if (activeAlert && !isMuted && isComponentMounted.current) {
                    timeoutId = setTimeout(() => playAudio(), 3000);
                }
            };
            return;
        }

        // Priority 3: Dynamic TTS (Text-to-Speech)
        const displayName = activeAlert.commonName || activeAlert.medName;
        const appearanceInfo = activeAlert.appearance ? `ที่เป็น ${activeAlert.appearance}` : '';
        const instructionInfo = activeAlert.instruction ? `ทาน${activeAlert.instruction}` : '';

        let text = "";

        if (activeAlert.stage === 0) {
             text = `คุณยายคะ อีก 10 นาที จะถึงเวลาทาน${displayName} แล้วนะคะ เตรียมน้ำ เตรียมยาไว้รอเลยนะคะ`;
        }
        else if (activeAlert.stage === 1) {
             text = `คุณยายคะ ถึงเวลาทาน${displayName} แล้วนะคะ ${appearanceInfo} ${instructionInfo} นะคะ เป็นห่วงน้า`;
        }
        else if (activeAlert.stage === 2) {
            text = `คุณยายคะ เลยเวลาทาน${displayName} มา 30 นาทีแล้วนะ ${appearanceInfo} ทานหน่อยนะคนเก่ง`;
        }
        else if (activeAlert.stage === 3) {
            text = `คุณยายคะ! ฉุกเฉินแล้ว ลืมทาน${displayName} นานเกินไปแล้ว รีบทานเดี๋ยวนี้เลยนะ!`;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.pitch = 1.4;
        utterance.rate = 0.9;
        utterance.volume = 1.0;

        utterance.onend = () => {
            if (activeAlert && !isMuted && isComponentMounted.current) {
                timeoutId = setTimeout(() => {
                    playAudio();
                }, 3000);
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    if (activeAlert && !isMuted) {
        playAudio();
    } else {
        window.speechSynthesis.cancel();
        if (audioRef.current) audioRef.current.pause();
        clearTimeout(timeoutId!);
    }

    return () => {
        window.speechSynthesis.cancel();
        if (audioRef.current) audioRef.current.pause();
        clearTimeout(timeoutId!);
    };
  }, [activeAlert, isMuted, customVoiceUrl]);

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
        
        let diffMinutes = currentTimeInMinutes - medTimeInMinutes;

        // --- STAGE 0: Pre-alert (10 minutes before) ---
        // Condition: Time is between -10 and -1 (e.g., 7:50 for 8:00)
        if (diffMinutes >= -10 && diffMinutes < 0) {
            const alertId = `${med.id}_stage0`;
            if (!dismissedAlerts.has(alertId) && !activeAlert) {
                setActiveAlert({
                    medId: med.id,
                    medName: med.name,
                    commonName: med.commonName,
                    appearance: med.appearance,
                    instruction: med.instruction,
                    stage: 0,
                    customVoice: med.customAlertVoice
                });
                setIsMuted(false);
            }
        }

        // --- STAGES 1, 2, 3: Late Alerts ---
        else if (diffMinutes >= 15) {
            let currentLevel = (med.alertLevel || 0) as 0 | 1 | 2 | 3;
            let triggeredStage: 0 | 1 | 2 | 3 | null = null;
            let newLevel: 0 | 1 | 2 | 3 = currentLevel;

            if (diffMinutes >= 15 && diffMinutes < 30 && currentLevel < 1) {
                triggeredStage = 1;
                newLevel = 1;
            }
            else if (diffMinutes >= 30 && diffMinutes < 60 && currentLevel < 2) {
                triggeredStage = 2;
                newLevel = 2;
            }
            else if (diffMinutes >= 60 && currentLevel < 3) {
                triggeredStage = 3;
                newLevel = 3;
            }

            if (triggeredStage) {
                const alertId = `${med.id}_stage${triggeredStage}`;
                // Only trigger if we haven't just dismissed this specific stage? 
                // Actually for late stages, we want to be persistent, but `activeAlert` check handles single instance.
                // The `dismissedAlerts` logic is mainly for the "Pre-alert" which shouldn't reappear once acknowledged.
                // For Late alerts, we rely on `alertLevel` in med object to prevent re-triggering same level repeatedly via `currentLevel < X`.
                
                setActiveAlert({ 
                    medId: med.id, 
                    medName: med.name, 
                    commonName: med.commonName,
                    appearance: med.appearance,
                    instruction: med.instruction,
                    stage: triggeredStage,
                    customVoice: med.customAlertVoice 
                });
                onUpdateMedication(med.id, { alertLevel: newLevel });
                setIsMuted(false);
            }
        }
      });
    };

    const interval = setInterval(checkMedications, 5000);
    return () => clearInterval(interval);
  }, [medications, onUpdateMedication, dismissedAlerts, activeAlert]);

  const handleDismiss = () => {
      if (activeAlert) {
          setDismissedAlerts(prev => new Set(prev).add(`${activeAlert.medId}_stage${activeAlert.stage}`));
          setActiveAlert(null);
      }
  };

  if (!activeAlert) return null;

  const displayName = activeAlert.commonName || activeAlert.medName;

  const stageConfig = {
    0: {
        gradient: 'from-sky-400 to-blue-500',
        icon: <Hourglass size={80} className="text-white animate-pulse" />,
        title: 'อีก 10 นาทีถึงเวลาค่ะ',
        subtitle: `เตรียมยา ${displayName} ไว้รอเลยนะคะ`,
        actionText: 'ทานตอนนี้เลย',
        secondaryActionText: 'รับทราบ (เตรียมแล้ว)',
        textColor: 'text-white',
        bgAnimate: ''
    },
    1: {
      gradient: 'from-yellow-400 to-orange-500',
      icon: <Bell size={80} className="text-white animate-[bounce_2s_infinite]" />,
      title: 'เลยเวลา 15 นาทีแล้วค่ะ',
      subtitle: `ยา ${displayName} สำคัญนะคะ`,
      actionText: 'ทานเรียบร้อยแล้ว',
      secondaryActionText: 'ขออีก 5 นาที',
      textColor: 'text-white',
      bgAnimate: ''
    },
    2: {
      gradient: 'from-orange-500 to-red-600',
      icon: <AlertTriangle size={80} className="text-white animate-pulse" />,
      title: 'เลยเวลา 30 นาทีแล้ว!',
      subtitle: 'เป็นห่วงนะคะ ทานยาเดี๋ยวนี้เลยน้า',
      actionText: 'ทานยาเดี๋ยวนี้',
      secondaryActionText: 'ปิดเสียงชั่วคราว',
      textColor: 'text-white',
      bgAnimate: ''
    },
    3: {
      gradient: 'from-red-600 to-red-900',
      icon: <Siren size={80} className="text-white animate-[spin_0.5s_infinite]" />,
      title: '🚨 ฉุกเฉิน! 1 ชั่วโมงแล้ว',
      subtitle: 'กรุณาทานยาทันที หรือโทรหาหนูนะ!',
      actionText: 'รับทราบ / กำลังทาน',
      secondaryActionText: 'ติดต่อฉุกเฉิน',
      textColor: 'text-red-50',
      bgAnimate: 'animate-pulse'
    }
  };

  const config = stageConfig[activeAlert.stage];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in safe-bottom bg-black`}>
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} opacity-90 ${config.bgAnimate}`} />
      
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-6 right-6 z-20 bg-white/20 p-3 rounded-full backdrop-blur-md text-white hover:bg-white/30 transition-colors"
      >
        {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} className="animate-pulse" />}
      </button>

      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-75" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8 text-center space-y-8">
        <div className={`bg-white/20 p-8 rounded-full shadow-2xl backdrop-blur-sm ring-4 ring-white/30 ${activeAlert.stage === 3 ? 'animate-bounce' : ''}`}>
            {config.icon}
        </div>

        <div className="space-y-2">
            <h2 className={`text-4xl font-bold ${config.textColor} drop-shadow-md`}>
                {config.title}
            </h2>
            <p className={`text-xl ${config.textColor} opacity-90 font-medium`}>
                {config.subtitle}
            </p>
            {!isMuted && (
                 <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 mt-2 animate-pulse">
                    <Volume2 size={16} className="mr-1 text-white"/>
                    <span className="text-xs text-white">
                        {activeAlert.stage === 0 
                            ? 'AI กำลังแจ้งเตือนล่วงหน้า...' 
                            : (activeAlert.customVoice ? 'เสียงเตือนเฉพาะยานี้...' : (customVoiceUrl ? 'เสียงเตือนทั่วไป...' : `เสียง AI พูด: ${displayName}`))}
                    </span>
                 </div>
            )}
        </div>

        <div className="bg-white/95 w-full p-6 rounded-3xl shadow-xl transform transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-bold flex items-center">
                    <Clock size={18} className="mr-1" /> ที่ต้องกินตอน
                </span>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${activeAlert.stage === 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {activeAlert.stage === 0 ? 'ใกล้ถึงเวลา' : 'เลยเวลา'}
                </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 text-left mb-1">
                {displayName}
            </h3>
            {activeAlert.commonName && <p className="text-slate-400 text-sm text-left mb-2">({activeAlert.medName})</p>}
            
            {activeAlert.appearance && (
                <div className="bg-slate-100 p-2 rounded-lg mb-2 text-left flex items-center">
                    <span className="w-3 h-3 rounded-full bg-slate-400 mr-2"></span>
                    <span className="text-slate-600 font-medium">{activeAlert.appearance}</span>
                </div>
            )}
            
            <p className="text-slate-500 text-left text-lg">
                เพื่อสุขภาพที่ดีของคุณยายนะคะ
            </p>
        </div>

        {/* Primary Action Button */}
        <button 
             onClick={() => {
                onTakeMedication(activeAlert.medId);
                setActiveAlert(null);
             }}
             className={`w-full bg-white py-5 rounded-full text-2xl font-bold shadow-2xl active:scale-95 transition-all flex items-center justify-center ring-4 ring-white/50 ${activeAlert.stage === 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'}`}
        >
             <CheckCircle className="mr-3" size={32} />
             {config.actionText}
        </button>

        {/* Secondary Action (Dismiss/Snooze) */}
        <button 
             onClick={handleDismiss}
             className="text-white/80 text-lg underline font-medium hover:text-white"
        >
             {config.secondaryActionText}
        </button>

      </div>
    </div>
  );
};

export default SafetyNetSystem;