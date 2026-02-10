import React, { useState, useRef } from 'react';
import { User, Plus, Pill, Clock, FileText, Activity, Save, BellRing, Mic, Square, Play, Trash2, Tag, Eye, Presentation, Package, AlertCircle, Sun, X, Camera } from 'lucide-react';
import { Medication } from '../types';
import { MOCK_USER } from '../constants';

interface Props {
  onAddMedication: (med: Medication) => void;
  onSimulateAlert?: () => void;
  onSimulateStage?: (stage: number) => void;
  onSimulateLowStock?: () => void;
  onSimulateOversleep?: () => void;
  onSaveVoice?: (blobUrl: string | null) => void;
}

const ProfileView: React.FC<Props> = ({ onAddMedication, onSimulateStage, onSimulateLowStock, onSimulateOversleep, onSaveVoice }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '', commonName: '', appearance: '', dosage: '', time: '', instruction: '', totalQuantity: '', reorderThreshold: ''
  });

  const [isRecordingGlobal, setIsRecordingGlobal] = useState(false);
  const [recordedUrlGlobal, setRecordedUrlGlobal] = useState<string | null>(null);
  const mediaRecorderGlobalRef = useRef<MediaRecorder | null>(null);
  const audioChunksGlobalRef = useRef<Blob[]>([]);

  const [isRecordingMed, setIsRecordingMed] = useState(false);
  const [recordedUrlMed, setRecordedUrlMed] = useState<string | null>(null);
  const mediaRecorderMedRef = useRef<MediaRecorder | null>(null);
  const audioChunksMedRef = useRef<Blob[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.time) return;

    const newMed: Medication = {
      id: Date.now().toString(),
      name: formData.name,
      commonName: formData.commonName || undefined,
      appearance: formData.appearance || undefined,
      dosage: formData.dosage || 'ตามแพทย์สั่ง',
      time: formData.time,
      instruction: formData.instruction || 'ตามแพทย์สั่ง',
      taken: false,
      type: 'pills',
      color: 'bg-white border-2 border-pink-200',
      customAlertVoice: recordedUrlMed || undefined,
      totalQuantity: formData.totalQuantity ? parseInt(formData.totalQuantity) : undefined,
      reorderThreshold: formData.reorderThreshold ? parseInt(formData.reorderThreshold) : 5
    };

    onAddMedication(newMed);
    setFormData({ name: '', commonName: '', appearance: '', dosage: '', time: '', instruction: '', totalQuantity: '', reorderThreshold: '' });
    setRecordedUrlMed(null);
    setIsFormVisible(false);
  };

  const startRecordingGlobal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderGlobalRef.current = mediaRecorder;
      audioChunksGlobalRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksGlobalRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksGlobalRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedUrlGlobal(audioUrl);
        if (onSaveVoice) onSaveVoice(audioUrl);
      };
      mediaRecorder.start();
      setIsRecordingGlobal(true);
    } catch (error) { alert('กรุณาอนุญาตให้ใช้ไมโครโฟน'); }
  };

  const stopRecordingGlobal = () => {
    if (mediaRecorderGlobalRef.current && isRecordingGlobal) {
      mediaRecorderGlobalRef.current.stop();
      setIsRecordingGlobal(false);
    }
  };

  const startRecordingMed = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderMedRef.current = mediaRecorder;
      audioChunksMedRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksMedRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksMedRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedUrlMed(audioUrl);
      };
      mediaRecorder.start();
      setIsRecordingMed(true);
    } catch (error) { alert('กรุณาอนุญาตให้ใช้ไมโครโฟน'); }
  };

  const stopRecordingMed = () => {
    if (mediaRecorderMedRef.current && isRecordingMed) {
      mediaRecorderMedRef.current.stop();
      setIsRecordingMed(false);
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6 overflow-y-auto h-full bg-slate-50">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-4 border-pink-200 relative group cursor-pointer active:scale-95 transition-all">
          <img 
            src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?q=80&w=400&h=400&auto=format&fit=crop" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white drop-shadow-md" size={32} />
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800">{MOCK_USER.name}</h2>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <span className="bg-pink-100 text-pink-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">อายุ {MOCK_USER.age} ปี</span>
          </div>
        </div>
      </div>

      {/* Disease Info Card */}
      <div className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-700 mb-2 flex items-center">
          <Activity className="mr-2 text-blue-500" size={24} /> โรคประจำตัว
        </h3>
        <p className="text-xl text-slate-600 pl-8 font-medium">{MOCK_USER.condition}</p>
      </div>

      {/* Voice Recorder Card */}
      <div className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h3 className="text-xl font-bold mb-2 flex items-center"><Mic className="mr-2" size={24} /> เสียงเตือนคนในบ้าน</h3>
        <p className="text-indigo-100 mb-6 text-sm opacity-90">อัดเสียงลูกหลานไว้เตือนให้กินยา</p>

        <div className="flex gap-3">
            {!isRecordingGlobal && !recordedUrlGlobal ? (
                <button onClick={startRecordingGlobal} className="flex-1 bg-white/20 p-4 rounded-2xl font-bold backdrop-blur-md hover:bg-white/30 active:scale-95 transition-all">
                    กดเพื่อเริ่มอัดเสียง
                </button>
            ) : isRecordingGlobal ? (
                <button onClick={stopRecordingGlobal} className="flex-1 bg-red-500 text-white p-4 rounded-2xl font-bold animate-pulse">
                    กำลังอัด... กดเพื่อหยุด
                </button>
            ) : (
                <div className="flex-1 flex gap-2">
                    <button onClick={() => new Audio(recordedUrlGlobal!).play()} className="flex-1 bg-white text-indigo-600 p-4 rounded-2xl font-bold shadow-md"><Play className="inline mr-1" size={20}/> ฟัง</button>
                    <button onClick={() => { setRecordedUrlGlobal(null); if(onSaveVoice) onSaveVoice(null); }} className="bg-white/20 p-4 rounded-2xl"><Trash2 size={24}/></button>
                </div>
            )}
        </div>
      </div>

      {/* Add Medication / Form */}
      <div>
        {!isFormVisible ? (
          <button 
            onClick={() => setIsFormVisible(true)}
            className="w-full bg-white border-2 border-dashed border-pink-300 text-pink-500 p-6 rounded-[2rem] flex items-center justify-center text-xl font-bold active:scale-95 transition-all hover:bg-pink-50"
          >
            <Plus className="mr-2" size={32} /> เพิ่มยาใหม่
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-xl border border-pink-100 space-y-5 animate-fade-in">
             <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-2xl font-bold text-slate-800">เพิ่มรายการยา</h3>
                <button type="button" onClick={() => setIsFormVisible(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={24}/></button>
             </div>

             <div className="space-y-4">
                <div>
                    <label className="font-bold text-slate-500 mb-1 block">ชื่อยา (หน้าซอง)</label>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="English Name" className="w-full p-4 bg-slate-50 rounded-xl text-lg border-2 border-slate-100 focus:border-pink-500 outline-none" required />
                </div>
                <div>
                    <label className="font-bold text-slate-500 mb-1 block">ชื่อเรียกง่ายๆ</label>
                    <input name="commonName" value={formData.commonName} onChange={handleChange} placeholder="เช่น ยาความดัน" className="w-full p-4 bg-slate-50 rounded-xl text-lg border-2 border-slate-100 focus:border-pink-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="font-bold text-slate-500 mb-1 block">เวลา</label>
                        <input name="time" type="time" value={formData.time} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl text-lg border-2 border-slate-100 focus:border-pink-500 outline-none" required />
                    </div>
                    <div>
                        <label className="font-bold text-slate-500 mb-1 block">ขนาด</label>
                        <input name="dosage" value={formData.dosage} onChange={handleChange} placeholder="1 เม็ด" className="w-full p-4 bg-slate-50 rounded-xl text-lg border-2 border-slate-100 focus:border-pink-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="font-bold text-slate-500 mb-1 block">วิธีทาน</label>
                    <input name="instruction" value={formData.instruction} onChange={handleChange} placeholder="หลังอาหาร" className="w-full p-4 bg-slate-50 rounded-xl text-lg border-2 border-slate-100 focus:border-pink-500 outline-none" />
                </div>
             </div>

             <button type="submit" className="w-full bg-pink-500 text-white p-5 rounded-2xl font-bold text-xl shadow-lg mt-4">บันทึกยา</button>
          </form>
        )}
      </div>

      {/* Demo Mode */}
      {onSimulateStage && (
          <div className="pt-8 border-t border-slate-200">
             <h3 className="text-slate-400 font-bold text-center mb-4 uppercase tracking-widest text-sm">ทดสอบระบบ (Demo Mode)</h3>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => onSimulateStage(0)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm">🔵 เตือนล่วงหน้า</button>
                 <button onClick={() => onSimulateStage(1)} className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl font-bold text-sm">🟡 เลย 15 นาที</button>
                 <button onClick={() => onSimulateStage(2)} className="p-4 bg-orange-50 text-orange-600 rounded-2xl font-bold text-sm">🟠 เลย 30 นาที</button>
                 <button onClick={() => onSimulateStage(3)} className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm">🔴 ฉุกเฉิน</button>
                 {onSimulateLowStock && <button onClick={onSimulateLowStock} className="p-4 bg-purple-50 text-purple-600 rounded-2xl font-bold text-sm col-span-2">📦 จำลองยาหมด</button>}
                 {onSimulateOversleep && <button onClick={onSimulateOversleep} className="p-4 bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm col-span-2">😴 จำลองตื่นสาย</button>}
             </div>
          </div>
      )}
    </div>
  );
};

export default ProfileView;