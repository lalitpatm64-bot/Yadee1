import React, { useState, useRef } from 'react';
import { User, Plus, Pill, Clock, FileText, Activity, Save, BellRing, Mic, Square, Play, Trash2, Tag, Eye, Presentation } from 'lucide-react';
import { Medication } from '../types';
import { MOCK_USER } from '../constants';

interface Props {
  onAddMedication: (med: Medication) => void;
  onSimulateAlert?: () => void; // Keeping for backward compatibility if needed
  onSimulateStage?: (stage: number) => void; // New prop for specific stage simulation
  onSaveVoice?: (blobUrl: string | null) => void;
}

const ProfileView: React.FC<Props> = ({ onAddMedication, onSimulateStage, onSaveVoice }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    commonName: '',
    appearance: '',
    dosage: '',
    time: '',
    instruction: ''
  });

  // Global Voice Recording State (Profile Level)
  const [isRecordingGlobal, setIsRecordingGlobal] = useState(false);
  const [recordedUrlGlobal, setRecordedUrlGlobal] = useState<string | null>(null);
  const mediaRecorderGlobalRef = useRef<MediaRecorder | null>(null);
  const audioChunksGlobalRef = useRef<Blob[]>([]);

  // Specific Medication Voice Recording State
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
      customAlertVoice: recordedUrlMed || undefined
    };

    onAddMedication(newMed);
    
    setFormData({ name: '', commonName: '', appearance: '', dosage: '', time: '', instruction: '' });
    setRecordedUrlMed(null);
    setIsFormVisible(false);
  };

  // --- Global Recorder Logic ---
  const startRecordingGlobal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderGlobalRef.current = mediaRecorder;
      audioChunksGlobalRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksGlobalRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksGlobalRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedUrlGlobal(audioUrl);
        if (onSaveVoice) onSaveVoice(audioUrl);
      };

      mediaRecorder.start();
      setIsRecordingGlobal(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('กรุณาอนุญาตให้ใช้ไมโครโฟนเพื่อบันทึกเสียงนะคะ');
    }
  };

  const stopRecordingGlobal = () => {
    if (mediaRecorderGlobalRef.current && isRecordingGlobal) {
      mediaRecorderGlobalRef.current.stop();
      setIsRecordingGlobal(false);
      mediaRecorderGlobalRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const playRecordingGlobal = () => {
    if (recordedUrlGlobal) new Audio(recordedUrlGlobal).play();
  };

  const deleteRecordingGlobal = () => {
    setRecordedUrlGlobal(null);
    if (onSaveVoice) onSaveVoice(null);
  };

  // --- Medication Specific Recorder Logic ---
  const startRecordingMed = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderMedRef.current = mediaRecorder;
      audioChunksMedRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksMedRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksMedRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedUrlMed(audioUrl);
      };

      mediaRecorder.start();
      setIsRecordingMed(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('กรุณาอนุญาตให้ใช้ไมโครโฟนเพื่อบันทึกเสียงนะคะ');
    }
  };

  const stopRecordingMed = () => {
    if (mediaRecorderMedRef.current && isRecordingMed) {
      mediaRecorderMedRef.current.stop();
      setIsRecordingMed(false);
      mediaRecorderMedRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const playRecordingMed = () => {
    if (recordedUrlMed) new Audio(recordedUrlMed).play();
  };

  const deleteRecordingMed = () => {
    setRecordedUrlMed(null);
  };

  return (
    <div className="p-6 pb-24 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 shadow-sm">
          <User size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">{MOCK_USER.name}</h2>
          <p className="text-lg text-slate-500">อายุ {MOCK_USER.age} ปี</p>
        </div>
      </div>

      {/* Voice Recorder Section (Global) */}
      <div className="w-full bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        
        <h3 className="text-xl font-bold mb-2 flex items-center">
            <Mic className="mr-2" size={24} />
            เสียงเตือนทั่วไป (เสียงกลาง)
        </h3>
        <p className="text-purple-100 mb-6 text-sm">
            บันทึกเสียงกลางสำหรับใช้เตือนทุกยา (หากไม่ได้ระบุเฉพาะเจาะจง)
        </p>

        <div className="flex items-center justify-between gap-4">
            {!isRecordingGlobal && !recordedUrlGlobal && (
                <button 
                    onClick={startRecordingGlobal}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
                >
                    <div className="bg-red-500 p-3 rounded-full mb-2 shadow-lg animate-pulse">
                        <Mic size={24} className="text-white" />
                    </div>
                    <span className="font-bold">กดเพื่ออัดเสียงกลาง</span>
                </button>
            )}

            {isRecordingGlobal && (
                <button 
                    onClick={stopRecordingGlobal}
                    className="flex-1 bg-red-500 hover:bg-red-600 p-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
                >
                    <div className="bg-white p-3 rounded-full mb-2 shadow-sm animate-bounce">
                        <Square size={24} className="text-red-500 fill-current" />
                    </div>
                    <span className="font-bold">กดเพื่อหยุด</span>
                </button>
            )}

            {recordedUrlGlobal && (
                <div className="flex-1 flex gap-2">
                    <button 
                        onClick={playRecordingGlobal}
                        className="flex-1 bg-white text-purple-600 p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95"
                    >
                        <Play size={32} className="fill-current mb-1" />
                        <span className="text-xs font-bold">ฟังเสียง</span>
                    </button>
                    <button 
                        onClick={deleteRecordingGlobal}
                        className="w-16 bg-red-400/20 hover:bg-red-400/30 text-white p-2 rounded-2xl flex items-center justify-center"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Disease Info */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
          <Activity className="mr-2 text-pink-500" size={24} />
          โรคประจำตัว
        </h3>
        <p className="text-lg text-slate-600 pl-8">{MOCK_USER.condition}</p>
      </div>

      {/* Emergency Info */}
      <div className="w-full bg-red-50 p-6 rounded-3xl border border-red-100">
        <h3 className="text-xl font-bold text-red-700 mb-2">เบอร์ฉุกเฉิน</h3>
        <p className="text-3xl font-bold text-red-600">1669</p>
      </div>

      {/* Add Medication Section */}
      <div>
        {!isFormVisible ? (
          <button 
            onClick={() => setIsFormVisible(true)}
            className="w-full bg-pink-500 text-white p-4 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <Plus className="mr-2" size={24} />
            เพิ่มยาใหม่
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-pink-100 space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-pink-800">เพิ่มรายการยา</h3>
                <button type="button" onClick={() => setIsFormVisible(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full">
                    <Plus size={24} className="rotate-45" />
                </button>
             </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <Pill size={20} className="mr-2 text-pink-500"/> ชื่อยา (ภาษาอังกฤษ/หน้าซอง)
              </label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="เช่น Amlodipine"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <Tag size={20} className="mr-2 text-pink-500"/> ชื่อเรียกง่ายๆ (ภาษาไทย)
              </label>
              <input 
                name="commonName"
                value={formData.commonName}
                onChange={handleChange}
                placeholder="เช่น ยาความดัน, ยาแก้แพ้"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <Eye size={20} className="mr-2 text-pink-500"/> ลักษณะยา
              </label>
              <input 
                name="appearance"
                value={formData.appearance}
                onChange={handleChange}
                placeholder="เช่น เม็ดสีขาวกลม, แคปซูลสีเขียว"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-slate-700 font-bold flex items-center text-lg">
                    <FileText size={20} className="mr-2 text-pink-500"/> ขนาด
                </label>
                <input 
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    placeholder="1 เม็ด"
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                />
                </div>
                <div className="space-y-2">
                <label className="text-slate-700 font-bold flex items-center text-lg">
                    <Clock size={20} className="mr-2 text-pink-500"/> เวลา
                </label>
                <input 
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
                    required
                />
                </div>
            </div>

            {/* Instruction */}
            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <FileText size={20} className="mr-2 text-pink-500"/> คำแนะนำ
              </label>
              <input 
                name="instruction"
                value={formData.instruction}
                onChange={handleChange}
                placeholder="เช่น หลังอาหาร"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-pink-500 outline-none text-lg"
              />
            </div>

            {/* Specific Voice Recorder */}
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                <label className="text-pink-800 font-bold flex items-center text-base mb-2">
                    <Mic size={18} className="mr-2"/> เสียงเตือนเฉพาะยานี้ (เลือกได้)
                </label>
                <div className="flex items-center gap-2">
                    {!isRecordingMed && !recordedUrlMed && (
                        <button 
                            type="button"
                            onClick={startRecordingMed}
                            className="flex-1 bg-white text-pink-600 border border-pink-200 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-pink-50"
                        >
                           กดเพื่ออัดเสียง (เช่น "กินยาเบาหวานนะ")
                        </button>
                    )}
                    {isRecordingMed && (
                        <button 
                            type="button"
                            onClick={stopRecordingMed}
                            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm animate-pulse"
                        >
                           กำลังอัด... (กดเพื่อหยุด)
                        </button>
                    )}
                    {recordedUrlMed && (
                        <div className="flex-1 flex gap-2">
                             <button 
                                type="button" 
                                onClick={playRecordingMed}
                                className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center"
                            >
                                <Play size={16} className="mr-1"/> ฟัง
                            </button>
                            <button 
                                type="button" 
                                onClick={deleteRecordingMed}
                                className="w-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    )}
                </div>
                {recordedUrlMed && <p className="text-xs text-green-600 mt-2 font-medium">✓ บันทึกเสียงเฉพาะยาเรียบร้อยแล้ว</p>}
            </div>

            <button 
                type="submit"
                className="w-full bg-pink-500 text-white p-4 rounded-xl font-bold text-xl mt-4 shadow-md flex items-center justify-center active:bg-pink-600 active:scale-95 transition-all"
            >
                <Save className="mr-2" size={24} />
                บันทึกข้อมูล
            </button>
          </form>
        )}
      </div>

      {/* Test / Simulation Section */}
      {onSimulateStage && (
          <div className="pt-6 border-t border-slate-200">
             <div className="flex items-center justify-center mb-4">
                 <Presentation className="text-slate-400 mr-2" size={20} />
                 <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wide">ส่วนทดสอบระบบ (Demo Mode)</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => onSimulateStage(0)}
                    className="p-3 bg-blue-100 text-blue-700 rounded-xl font-bold shadow-sm active:scale-95 flex flex-col items-center"
                 >
                    <Clock size={24} className="mb-1"/>
                    <span>🔵 เตือนล่วงหน้า</span>
                 </button>

                 <button 
                    onClick={() => onSimulateStage(1)}
                    className="p-3 bg-yellow-100 text-yellow-700 rounded-xl font-bold shadow-sm active:scale-95 flex flex-col items-center"
                 >
                    <BellRing size={24} className="mb-1"/>
                    <span>🟡 เลย 15 นาที</span>
                 </button>

                 <button 
                    onClick={() => onSimulateStage(2)}
                    className="p-3 bg-orange-100 text-orange-700 rounded-xl font-bold shadow-sm active:scale-95 flex flex-col items-center"
                 >
                    <BellRing size={24} className="mb-1 animate-pulse"/>
                    <span>🟠 เลย 30 นาที</span>
                 </button>

                 <button 
                    onClick={() => onSimulateStage(3)}
                    className="p-3 bg-red-100 text-red-700 rounded-xl font-bold shadow-sm active:scale-95 flex flex-col items-center"
                 >
                    <BellRing size={24} className="mb-1 animate-bounce"/>
                    <span>🔴 ฉุกเฉิน (1 ชม.)</span>
                 </button>
             </div>
          </div>
      )}
    </div>
  );
};

export default ProfileView;