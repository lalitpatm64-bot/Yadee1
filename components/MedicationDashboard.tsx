import React, { useState } from 'react';
import { Medication, UserProfile, VitalSigns } from '../types';
import { CheckCircle, Circle, Sun, Moon, Coffee, Phone, Activity, Heart, Edit3, X, Save, Pill } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  user: UserProfile;
  medications: Medication[];
  vitals: VitalSigns;
  onUpdateVitals: (vitals: Partial<VitalSigns>) => void;
  onToggleMed: (id: string) => void;
}

const MedicationDashboard: React.FC<Props> = ({ user, medications, vitals, onUpdateVitals, onToggleMed }) => {
  const [editingVital, setEditingVital] = useState<'pressure' | 'sugar' | null>(null);
  const [confirmMed, setConfirmMed] = useState<Medication | null>(null); // State for confirmation modal
  
  // Temporary state for the modal inputs
  const [tempSys, setTempSys] = useState(vitals.systolic.toString());
  const [tempDia, setTempDia] = useState(vitals.diastolic.toString());
  const [tempSugar, setTempSugar] = useState(vitals.sugar.toString());

  // Compliance Data for Chart
  const takenCount = medications.filter(m => m.taken).length;
  const totalCount = medications.length;
  const percentage = Math.round((takenCount / totalCount) * 100);

  const data = [
    { name: 'Taken', value: takenCount },
    { name: 'Remaining', value: totalCount - takenCount },
  ];
  const COLORS = ['#db2777', '#e2e8f0']; 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 16) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  const handleSaveVitals = () => {
    if (editingVital === 'pressure') {
        onUpdateVitals({
            systolic: parseInt(tempSys),
            diastolic: parseInt(tempDia)
        });
    } else if (editingVital === 'sugar') {
        onUpdateVitals({
            sugar: parseInt(tempSugar)
        });
    }
    setEditingVital(null);
  };

  const handleConfirmToggle = () => {
    if (confirmMed) {
        onToggleMed(confirmMed.id);
        setConfirmMed(null);
    }
  };

  const getPressureColor = (sys: number, dia: number) => {
      if (sys > 140 || dia > 90) return 'text-red-600 bg-red-50 border-red-200';
      if (sys > 120 || dia > 80) return 'text-orange-600 bg-orange-50 border-orange-200';
      return 'text-green-700 bg-green-50 border-green-200'; // Normal
  };

  const getSugarColor = (sugar: number) => {
      if (sugar > 125) return 'text-red-600 bg-red-50 border-red-200'; // Diabetes
      if (sugar > 100) return 'text-orange-600 bg-orange-50 border-orange-200'; // Prediabetes
      return 'text-blue-700 bg-blue-50 border-blue-200'; // Normal
  };

  const formatLastUpdated = (date: Date) => {
      const now = new Date();
      if (date.getDate() === now.getDate()) return "วันนี้ " + date.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
      return "เมื่อวาน";
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 pb-24 relative">
      
      {/* 1. Medication Confirmation Modal */}
      {confirmMed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col items-center text-center">
                
                <div className={`p-6 rounded-full mb-4 ${confirmMed.taken ? 'bg-slate-100 text-slate-400' : 'bg-pink-100 text-pink-600'}`}>
                    {confirmMed.taken ? <X size={48} /> : <Pill size={48} />}
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-1">{confirmMed.name}</h3>
                <p className="text-xl text-slate-600 mb-6">{confirmMed.dosage} • {confirmMed.instruction}</p>

                <p className="text-slate-500 mb-6 text-lg">
                    {confirmMed.taken 
                        ? "คุณต้องการยกเลิกการทานยานี้ใช่ไหมคะ?" 
                        : "คุณทานยานี้เรียบร้อยแล้วใช่ไหมคะ?"}
                </p>

                <button 
                    onClick={handleConfirmToggle}
                    className={`w-full p-5 rounded-2xl font-bold text-2xl mb-3 shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                        confirmMed.taken 
                        ? 'bg-slate-200 text-slate-700' 
                        : 'bg-pink-500 text-white'
                    }`}
                >
                    {confirmMed.taken ? 'ยกเลิก (ยังไม่ได้ทาน)' : 'ใช่ ทานเรียบร้อย'}
                </button>

                <button 
                    onClick={() => setConfirmMed(null)}
                    className="text-slate-400 text-lg font-medium py-2 px-4 hover:bg-slate-50 rounded-xl"
                >
                    ปิดหน้าต่าง
                </button>
            </div>
        </div>
      )}

      {/* 2. Vitals Input Modal */}
      {editingVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">
                        {editingVital === 'pressure' ? 'จดบันทึกความดัน' : 'จดบันทึกค่าน้ำตาล'}
                    </h3>
                    <button onClick={() => setEditingVital(null)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {editingVital === 'pressure' ? (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold">ตัวบน (Sys)</label>
                                <input 
                                    type="number" 
                                    value={tempSys}
                                    onChange={(e) => setTempSys(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-2xl text-3xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center pt-8 text-2xl text-slate-300">/</div>
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold">ตัวล่าง (Dia)</label>
                                <input 
                                    type="number" 
                                    value={tempDia}
                                    onChange={(e) => setTempDia(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-2xl text-3xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                             <label className="block text-slate-500 mb-2 font-bold">ระดับน้ำตาล (mg/dL)</label>
                             <input 
                                type="number" 
                                value={tempSugar}
                                onChange={(e) => setTempSugar(e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-2xl text-3xl font-bold text-center border-2 border-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleSaveVitals}
                        className="w-full bg-pink-500 text-white p-4 rounded-xl font-bold text-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Save className="mr-2" size={24} />
                        บันทึกข้อมูล
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center bg-pink-500 text-white p-6 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}ค่ะ,</h1>
          <h2 className="text-xl font-medium opacity-90">{user.name}</h2>
          <p className="text-pink-100 mt-1 text-base">วันนี้คุณเก่งมากเลยนะคะ!</p>
        </div>
        <div className="bg-white/20 p-2 rounded-full">
           <Sun size={40} className="text-yellow-300" />
        </div>
      </header>

      {/* Compliance Summary */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">สรุปการทานยา</h2>
          <p className="text-slate-500 text-lg">ทานไปแล้ว {percentage}%</p>
          <p className="text-sm text-slate-400 mt-1">เหลืออีก {totalCount - takenCount} เม็ด</p>
        </div>
        <div className="w-24 h-24">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={40}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Interactive Vitals / Health Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pressure Card */}
        <button 
            onClick={() => {
                setTempSys(vitals.systolic.toString());
                setTempDia(vitals.diastolic.toString());
                setEditingVital('pressure');
            }}
            className={`p-4 rounded-3xl border transition-all active:scale-95 text-left relative overflow-hidden ${getPressureColor(vitals.systolic, vitals.diastolic)}`}
        >
            <div className="absolute top-2 right-2 opacity-20">
                <Edit3 size={20} />
            </div>
            <div className="flex items-center mb-2 font-bold opacity-80">
                <Activity size={20} className="mr-2"/>
                <span>ความดัน</span>
            </div>
            <p className="text-3xl font-bold">{vitals.systolic}/{vitals.diastolic}</p>
            <p className="text-xs opacity-70 mt-1">{formatLastUpdated(vitals.lastUpdated)}</p>
        </button>

        {/* Sugar Card */}
        <button 
            onClick={() => {
                setTempSugar(vitals.sugar.toString());
                setEditingVital('sugar');
            }}
            className={`p-4 rounded-3xl border transition-all active:scale-95 text-left relative overflow-hidden ${getSugarColor(vitals.sugar)}`}
        >
            <div className="absolute top-2 right-2 opacity-20">
                <Edit3 size={20} />
            </div>
             <div className="flex items-center mb-2 font-bold opacity-80">
                <Heart size={20} className="mr-2"/>
                <span>น้ำตาล</span>
            </div>
            <p className="text-3xl font-bold">{vitals.sugar}</p>
            <p className="text-xs opacity-70 mt-1">mg/dL</p>
        </button>
      </div>

      {/* Med List */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 pl-2 border-l-4 border-pink-500">ยาที่ต้องทานวันนี้</h2>
        <div className="space-y-4">
          {medications.map((med) => (
            <div 
              key={med.id} 
              // Changed onClick to setConfirmMed instead of direct toggle
              onClick={() => setConfirmMed(med)}
              className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
                med.taken ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200 shadow-sm hover:border-pink-300'
              }`}
            >
              <div className="mr-4 pointer-events-none">
                {med.taken ? (
                  <CheckCircle size={44} className="text-pink-500" />
                ) : (
                  <Circle size={44} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 pointer-events-none">
                <h3 className={`text-xl font-bold ${med.taken ? 'text-pink-800 line-through decoration-2' : 'text-slate-800'}`}>
                  {med.name}
                </h3>
                <p className="text-slate-500 text-lg">{med.dosage}</p>
                <div className="flex items-center mt-1 text-slate-600 font-medium bg-slate-100 w-fit px-2 py-1 rounded-lg">
                   {med.time < "10:00" ? <Sun size={18} className="mr-1"/> : med.time > "18:00" ? <Moon size={18} className="mr-1"/> : <Coffee size={18} className="mr-1"/>}
                   <span>{med.time} - {med.instruction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Button for Dashboard */}
      <a href="tel:1669" className="flex items-center justify-center space-x-3 bg-red-50 text-red-700 p-4 rounded-2xl border-2 border-red-100 active:scale-95 transition-transform shadow-sm">
        <div className="bg-red-500 text-white p-2 rounded-full shadow-md">
            <Phone size={24} />
        </div>
        <span className="text-xl font-bold">โทรฉุกเฉิน 1669</span>
      </a>
      
      {/* Health Tip */}
      <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
        <h3 className="text-lg font-bold text-orange-800 mb-2">💡 เคล็ดลับสุขภาพ</h3>
        <p className="text-orange-700 text-lg leading-relaxed">
          วันนี้อากาศเปลี่ยนแปลง อย่าลืมดื่มน้ำอุ่นๆ และพักผ่อนให้เพียงพอนะคะ
        </p>
      </div>
    </div>
  );
};

export default MedicationDashboard;