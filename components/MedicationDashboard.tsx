import React, { useState } from 'react';
import { Medication, UserProfile, VitalSigns } from '../types';
import { CheckCircle, Circle, Sun, Moon, Coffee, Phone, Activity, Heart, Edit3, X, Save, Pill, Info, Share2, Sparkles, Smile, Meh, Frown, Copy, Package, Sunrise, ChevronRight, AlertCircle, Volume2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { generateDailyReport } from '../services/geminiService';
import { speakText } from '../constants';

interface Props {
  user: UserProfile;
  medications: Medication[];
  vitals: VitalSigns;
  onUpdateVitals: (vitals: Partial<VitalSigns>) => void;
  onToggleMed: (id: string) => void;
  isCheckedIn: boolean; 
  onCheckIn: () => void; 
}

const MedicationDashboard: React.FC<Props> = ({ user, medications, vitals, onUpdateVitals, onToggleMed, isCheckedIn, onCheckIn }) => {
  const [editingVital, setEditingVital] = useState<'pressure' | 'sugar' | null>(null);
  const [confirmMed, setConfirmMed] = useState<Medication | null>(null);
  const [mood, setMood] = useState<string>('Happy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const [tempSys, setTempSys] = useState(vitals.systolic.toString());
  const [tempDia, setTempDia] = useState(vitals.diastolic.toString());
  const [tempSugar, setTempSugar] = useState(vitals.sugar.toString());

  const takenCount = medications.filter(m => m.taken).length;
  const totalCount = medications.length;
  const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const data = [
    { name: 'Taken', value: takenCount },
    { name: 'Remaining', value: totalCount - takenCount },
  ];
  const COLORS = ['#EC4899', '#F1F5F9']; 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "อรุณสวัสดิ์";
    if (hour < 16) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  const handleSaveVitals = () => {
    if (editingVital === 'pressure') {
        onUpdateVitals({
            systolic: parseInt(tempSys),
            diastolic: parseInt(tempDia)
        });
        speakText(`บันทึกความดัน ${tempSys} ตัวล่าง ${tempDia} เรียบร้อยแล้วค่ะ`);
    } else if (editingVital === 'sugar') {
        onUpdateVitals({
            sugar: parseInt(tempSugar)
        });
        speakText(`บันทึกค่าน้ำตาล ${tempSugar} เรียบร้อยแล้วค่ะ`);
    }
    setEditingVital(null);
  };

  const handleConfirmToggle = () => {
    if (confirmMed) {
        onToggleMed(confirmMed.id);
        if (!confirmMed.taken) {
            speakText(`เก่งมากค่ะ ทานยา${confirmMed.commonName || confirmMed.name} เรียบร้อยแล้ว`);
        }
        setConfirmMed(null);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    speakText("กำลังเขียนข้อความถึงลูกหลาน รอสักครู่นะคะ");
    const text = await generateDailyReport(user, medications, vitals, mood);
    setReportText(text);
    setIsGenerating(false);
    speakText("เขียนเสร็จแล้วค่ะ กดปุ่มสีเขียวเพื่อส่งไลน์ได้เลย");
  };

  const copyToClipboard = () => {
    if (reportText) {
        navigator.clipboard.writeText(reportText);
        alert('คัดลอกข้อความเรียบร้อยแล้ว ส่งในไลน์ได้เลยค่ะ!');
        speakText("คัดลอกแล้วค่ะ เปิดไลน์แล้ววางส่งได้เลย");
    }
  };

  const getPressureColor = (sys: number, dia: number) => {
      if (sys > 140 || dia > 90) return 'from-red-50 to-red-100 text-red-800 border-red-200';
      if (sys > 120 || dia > 80) return 'from-orange-50 to-orange-100 text-orange-800 border-orange-200';
      return 'from-green-50 to-green-100 text-green-800 border-green-200';
  };

  const getSugarColor = (sugar: number) => {
      if (sugar > 125) return 'from-red-50 to-red-100 text-red-800 border-red-200'; 
      if (sugar > 100) return 'from-orange-50 to-orange-100 text-orange-800 border-orange-200'; 
      return 'from-blue-50 to-blue-100 text-blue-800 border-blue-200'; 
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 relative pb-32">
      
      {/* 1. Confirm Modal (Elderly Friendly) */}
      {confirmMed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col items-center text-center">
                <div className={`p-6 rounded-full mb-4 shadow-inner ${confirmMed.taken ? 'bg-slate-100 text-slate-400' : 'bg-pink-100 text-pink-600'}`}>
                    {confirmMed.taken ? <X size={64} /> : <Pill size={64} />}
                </div>

                <h3 className="text-3xl font-bold text-slate-800 mb-2 leading-tight">
                    {confirmMed.commonName || confirmMed.name}
                </h3>
                
                <div className="bg-slate-50 p-6 rounded-3xl w-full my-4 border-2 border-slate-100">
                     <p className="text-2xl text-slate-700 font-bold mb-2">
                        {confirmMed.dosage}
                     </p>
                     <div className="flex items-center justify-center text-slate-500 text-lg">
                        <Coffee className="mr-2" size={24}/>
                        {confirmMed.instruction}
                     </div>
                </div>

                <p className="text-slate-500 mb-6 text-xl">
                    {confirmMed.taken 
                        ? "จะยกเลิกว่ากินแล้วเหรอคะ?" 
                        : "กินยานี้เรียบร้อยแล้วใช่มั้ยคะ?"}
                </p>

                <button 
                    onClick={handleConfirmToggle}
                    className={`w-full p-6 rounded-[1.5rem] font-bold text-2xl mb-3 shadow-xl active:scale-95 transition-all flex items-center justify-center ${
                        confirmMed.taken 
                        ? 'bg-slate-200 text-slate-600' 
                        : 'bg-pink-500 text-white'
                    }`}
                >
                    <CheckCircle className="mr-3" size={32} />
                    {confirmMed.taken ? 'ยังไม่ได้กิน' : 'กินแล้วค่ะ'}
                </button>

                <button 
                    onClick={() => setConfirmMed(null)}
                    className="text-slate-400 text-lg font-bold py-4 px-8 rounded-full hover:bg-slate-100"
                >
                    ปิดหน้าต่าง
                </button>
            </div>
        </div>
      )}

      {/* 2. Vitals Modal */}
      {editingVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-bold text-slate-800">
                        {editingVital === 'pressure' ? 'ความดัน' : 'น้ำตาล'}
                    </h3>
                    <button onClick={() => setEditingVital(null)} className="p-3 bg-slate-100 rounded-full text-slate-500">
                        <X size={32} />
                    </button>
                </div>

                <div className="space-y-8">
                    {editingVital === 'pressure' ? (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold text-xl">ตัวบน</label>
                                <input 
                                    type="number" 
                                    value={tempSys}
                                    onChange={(e) => setTempSys(e.target.value)}
                                    className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center pt-8 text-4xl text-slate-300">/</div>
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold text-xl">ตัวล่าง</label>
                                <input 
                                    type="number" 
                                    value={tempDia}
                                    onChange={(e) => setTempDia(e.target.value)}
                                    className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                             <label className="block text-slate-500 mb-2 font-bold text-xl">ค่าน้ำตาล</label>
                             <input 
                                type="number" 
                                value={tempSugar}
                                onChange={(e) => setTempSugar(e.target.value)}
                                className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleSaveVitals}
                        className="w-full bg-pink-500 text-white p-6 rounded-[1.5rem] font-bold text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Save className="mr-3" size={32} />
                        บันทึก
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Report Modal */}
      {reportText && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                      <Sparkles className="text-yellow-400 mr-2" size={32}/> 
                      ข้อความถึงลูกหลาน
                  </h3>
                  <div className="bg-pink-50 p-6 rounded-[1.5rem] text-xl text-slate-700 leading-relaxed border-2 border-pink-100 mb-6 font-medium">
                      "{reportText}"
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setReportText(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl text-lg">ปิด</button>
                      <button onClick={copyToClipboard} className="flex-[2] bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 flex items-center justify-center text-lg">
                          <Copy className="mr-2" size={24}/> คัดลอกส่งไลน์
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- HEADER SECTION --- */}
      <header className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-sm relative z-10 border-b border-slate-100">
        <div className="flex justify-between items-start">
            <div onClick={() => speakText(`${getGreeting()}ค่ะ ${user.name} วันนี้ทานยาไปแล้ว ${percentage} เปอร์เซ็นต์ค่ะ`)}>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    {getGreeting()} <Sun className="ml-2 text-orange-400" size={32} />
                </h1>
                <p className="text-xl text-slate-500 mt-1 font-medium">{user.name}</p>
            </div>
            <div className="bg-pink-50 p-2 rounded-full border border-pink-100">
                 <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {percentage}%
                 </div>
            </div>
        </div>
        
        {/* Morning Check-in (Prominent) */}
        {!isCheckedIn && (
            <button 
                onClick={() => {
                    onCheckIn();
                    speakText("อรุณสวัสดิ์ค่ะ แจ้งเตือนลูกหลานเรียบร้อยแล้ว รับคะแนนสะสม 30 คะแนนค่ะ");
                }}
                className="w-full mt-6 bg-gradient-to-r from-orange-400 to-amber-500 text-white p-6 rounded-[2rem] shadow-lg shadow-orange-200 flex items-center justify-between active:scale-95 transition-all animate-[pulse_3s_infinite]"
            >
                <div className="flex items-center">
                    <div className="bg-white/20 p-3 rounded-full mr-4">
                        <Sunrise size={32} className="text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-2xl">กดเช็คอินตอนเช้า</p>
                        <p className="text-orange-100 text-lg">บอกลูกหลานว่าตื่นแล้ว</p>
                    </div>
                </div>
                <ChevronRight size={32} className="opacity-80"/>
            </button>
        )}
      </header>

      <div className="p-4 space-y-6 mt-2">
        
        {/* --- SUMMARY & MOOD --- */}
        <div className="flex gap-4">
             {/* Mood Selector */}
             <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <span className="text-slate-400 font-bold mb-2 text-sm">อารมณ์วันนี้</span>
                <div className="flex gap-2 w-full justify-around">
                     <button onClick={() => { setMood('Happy'); speakText('วันนี้สดใสดีจังค่ะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Happy' ? 'bg-green-100 text-green-600 scale-110' : 'text-slate-300'}`}><Smile size={32}/></button>
                     <button onClick={() => { setMood('Neutral'); speakText('วันนี้รู้สึกเฉยๆ นะคะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Neutral' ? 'bg-yellow-100 text-yellow-600 scale-110' : 'text-slate-300'}`}><Meh size={32}/></button>
                     <button onClick={() => { setMood('Sick'); speakText('วันนี้ไม่ค่อยสบาย หายไวๆ นะคะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Sick' ? 'bg-red-100 text-red-600 scale-110' : 'text-slate-300'}`}><Frown size={32}/></button>
                </div>
             </div>
             
             {/* Simple Compliance */}
             <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden" onClick={() => speakText(`ทานยาไปแล้ว ${takenCount} จาก ${totalCount} เม็ดค่ะ`)}>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent"></div>
                <span className="text-slate-400 font-bold mb-1 text-sm relative z-10">ยาที่กินแล้ว</span>
                <span className="text-4xl font-black text-pink-500 relative z-10">{takenCount}<span className="text-lg text-slate-300 font-bold">/{totalCount}</span></span>
             </div>
        </div>

        {/* --- VITALS (BIG CARDS) --- */}
        <div>
            <h2 className="text-xl font-bold text-slate-600 mb-3 ml-2 flex items-center">
                <Activity className="mr-2 text-blue-500" size={24}/> สุขภาพวันนี้
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => { 
                        setTempSys(vitals.systolic.toString()); 
                        setTempDia(vitals.diastolic.toString()); 
                        setEditingVital('pressure'); 
                        speakText(`ความดันล่าสุด ${vitals.systolic} กับ ${vitals.diastolic} กดเพื่อแก้ไขค่ะ`);
                    }}
                    className={`p-5 rounded-[2rem] border-2 bg-gradient-to-br shadow-sm active:scale-95 transition-all text-left flex flex-col justify-between h-36 ${getPressureColor(vitals.systolic, vitals.diastolic)}`}
                >
                    <div className="flex justify-between items-start opacity-70">
                        <span className="font-bold text-lg">ความดัน</span>
                        <Edit3 size={20} />
                    </div>
                    <div className="self-center text-center">
                        <span className="text-3xl font-black block">{vitals.systolic}</span>
                        <div className="w-12 h-1 bg-current opacity-30 mx-auto my-1 rounded-full"></div>
                        <span className="text-3xl font-black block">{vitals.diastolic}</span>
                    </div>
                </button>

                <button 
                    onClick={() => { 
                        setTempSugar(vitals.sugar.toString()); 
                        setEditingVital('sugar'); 
                        speakText(`ค่าน้ำตาลล่าสุด ${vitals.sugar} กดเพื่อแก้ไขค่ะ`);
                    }}
                    className={`p-5 rounded-[2rem] border-2 bg-gradient-to-br shadow-sm active:scale-95 transition-all text-left flex flex-col justify-between h-36 ${getSugarColor(vitals.sugar)}`}
                >
                    <div className="flex justify-between items-start opacity-70">
                        <span className="font-bold text-lg">น้ำตาล</span>
                        <Edit3 size={20} />
                    </div>
                    <div className="self-center text-center mt-2">
                        <span className="text-5xl font-black block">{vitals.sugar}</span>
                        <span className="text-sm font-bold opacity-60">mg/dL</span>
                    </div>
                </button>
            </div>
        </div>

        {/* --- MEDICATION LIST (THE CORE) --- */}
        <div>
            <h2 className="text-xl font-bold text-slate-600 mb-3 ml-2 flex items-center">
                <Pill className="mr-2 text-pink-500" size={24}/> ยาที่ต้องกิน
            </h2>
            <div className="space-y-4">
            {medications.map((med) => (
                <div 
                key={med.id} 
                onClick={() => setConfirmMed(med)}
                className={`relative overflow-hidden group p-1 rounded-[2rem] transition-all cursor-pointer active:scale-[0.98] shadow-sm ${
                    med.taken ? 'bg-slate-100' : 'bg-white shadow-md hover:shadow-lg'
                }`}
                >
                <div className={`absolute left-0 top-0 bottom-0 w-3 ${med.taken ? 'bg-slate-300' : 'bg-pink-500'}`}></div>
                <div className="flex items-center p-5 pl-6">
                    {/* Icon Status */}
                    <div className={`mr-5 transition-all duration-300 ${med.taken ? 'scale-90 opacity-50' : 'scale-105'}`}>
                        {med.taken ? (
                            <CheckCircle size={48} className="text-slate-400" />
                        ) : (
                            <div className="w-12 h-12 rounded-full border-4 border-pink-200 flex items-center justify-center bg-pink-50">
                                <div className="w-6 h-6 bg-pink-500 rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-2xl font-bold leading-tight ${med.taken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {med.commonName || med.name}
                            </h3>
                            
                            {/* Audio Helper Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const text = `ยา ${med.commonName || med.name}, กิน ${med.dosage}, ${med.instruction}, เวลา ${med.time}`;
                                    speakText(text);
                                }}
                                className="ml-2 bg-pink-100 text-pink-600 p-2 rounded-full active:scale-95 hover:bg-pink-200"
                            >
                                <Volume2 size={24} />
                            </button>

                            {med.totalQuantity !== undefined && med.totalQuantity <= (med.reorderThreshold || 5) && !med.taken && (
                                <div className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center whitespace-nowrap ml-2">
                                    <AlertCircle size={12} className="mr-1"/> ใกล้หมด
                                </div>
                            )}
                        </div>
                        
                        <p className={`text-lg font-medium mb-2 ${med.taken ? 'text-slate-400' : 'text-slate-600'}`}>
                            {med.dosage}
                        </p>
                        
                        {!med.taken && (
                            <div className="inline-flex items-center bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600 font-bold text-sm">
                                {med.time < "10:00" ? <Sun size={16} className="mr-1 text-orange-500"/> : med.time > "18:00" ? <Moon size={16} className="mr-1 text-purple-500"/> : <Coffee size={16} className="mr-1 text-brown-500"/>}
                                {med.time} น. — {med.instruction}
                            </div>
                        )}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* --- FAMILY CONNECT & EMERGENCY --- */}
        <div className="grid grid-cols-5 gap-3 pt-2">
            <button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="col-span-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-[2rem] flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all"
            >
                {isGenerating ? <span className="animate-pulse">กำลังเขียน...</span> : <><Share2 className="mr-2" size={24} /> ส่งไลน์ให้ลูก</>}
            </button>

            <a href="tel:1669" className="col-span-2 bg-red-100 text-red-600 p-5 rounded-[2rem] flex flex-col items-center justify-center font-bold text-lg border-2 border-red-200 active:scale-95 transition-all">
                <Phone size={28} className="mb-1"/>
                <span>ฉุกเฉิน</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default MedicationDashboard;