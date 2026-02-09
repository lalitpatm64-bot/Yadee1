import React from 'react';
import { Medication, UserProfile } from '../types';
import { CheckCircle, Circle, Sun, Moon, Coffee, Phone, Activity, Heart } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  user: UserProfile;
  medications: Medication[];
  onToggleMed: (id: string) => void;
}

const MedicationDashboard: React.FC<Props> = ({ user, medications, onToggleMed }) => {
  // Compliance Data for Chart
  const takenCount = medications.filter(m => m.taken).length;
  const totalCount = medications.length;
  const percentage = Math.round((takenCount / totalCount) * 100);

  const data = [
    { name: 'Taken', value: takenCount },
    { name: 'Remaining', value: totalCount - takenCount },
  ];
  const COLORS = ['#14b8a6', '#e2e8f0']; // Teal and Slate

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 16) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center bg-teal-600 text-white p-6 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}ค่ะ,</h1>
          <h2 className="text-xl font-medium opacity-90">{user.name}</h2>
          <p className="text-teal-100 mt-1 text-base">วันนี้คุณเก่งมากเลยนะคะ!</p>
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
      
      {/* Vitals / Health Status (New Feature) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-pink-50 p-4 rounded-3xl border border-pink-100">
            <div className="flex items-center text-pink-700 mb-2">
                <Activity size={20} className="mr-2"/>
                <span className="font-bold">ความดัน</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">128/80</p>
            <p className="text-xs text-slate-500 mt-1">ปกติ (เมื่อวาน)</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
             <div className="flex items-center text-blue-700 mb-2">
                <Heart size={20} className="mr-2"/>
                <span className="font-bold">น้ำตาล</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">105</p>
            <p className="text-xs text-slate-500 mt-1">mg/dL (เช้านี้)</p>
        </div>
      </div>

      {/* Med List */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4 pl-2 border-l-4 border-teal-500">ยาที่ต้องทานวันนี้</h2>
        <div className="space-y-4">
          {medications.map((med) => (
            <div 
              key={med.id} 
              className={`flex items-center p-4 rounded-2xl border-2 transition-all ${
                med.taken ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div 
                onClick={() => onToggleMed(med.id)}
                className="cursor-pointer mr-4"
              >
                {med.taken ? (
                  <CheckCircle size={44} className="text-teal-500" />
                ) : (
                  <Circle size={44} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${med.taken ? 'text-teal-800 line-through decoration-2' : 'text-slate-800'}`}>
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