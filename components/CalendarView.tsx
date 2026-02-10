import React, { useState, useRef } from 'react';
import { Calendar, Clock, MapPin, Plus, Camera, Loader2, CheckCircle, X, ChevronRight, Stethoscope } from 'lucide-react';
import { Appointment } from '../types';
import { parseAppointmentCard } from '../services/geminiService';
import { speakText } from '../constants';

interface Props {
  appointments: Appointment[];
  onAddAppointment: (apt: Appointment) => void;
}

const CalendarView: React.FC<Props> = ({ appointments, onAddAppointment }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers for Calendar Grid ---
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Mock health status for past days (green/red)
  const getDayStatus = (day: number) => {
    if (day > currentDay) return 'future';
    if (day === currentDay) return 'today';
    // Random mock data: 80% chance of green
    const isGood = (day * 13) % 10 > 2; 
    return isGood ? 'good' : 'bad';
  };

  const hasAppointment = (day: number) => {
    // Check if any appointment falls on this day number (simplified for current month)
    return appointments.some(apt => parseInt(apt.date.split('-')[2]) === day);
  };

  // --- Scan Logic ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(false);
    setIsProcessing(true);
    speakText("กำลังอ่านใบนัด รอสักครู่นะคะ");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      const result = await parseAppointmentCard(base64Data);
      
      if (result) {
          const newApt: Appointment = {
              id: Date.now().toString(),
              title: result.title || "นัดพบแพทย์",
              date: result.date,
              time: result.time || "09:00",
              location: result.location || "โรงพยาบาล",
              doctor: result.doctor,
              type: 'checkup'
          };
          onAddAppointment(newApt);
          speakText(`เพิ่มนัดหมายวันที่ ${result.date} เรียบร้อยแล้วค่ะ`);
      } else {
          speakText("ขออภัยค่ะ อ่านใบนัดไม่ได้ ลองกรอกเองนะคะ");
          alert("ไม่สามารถอ่านข้อมูลได้ กรุณาลองใหม่");
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-slate-50 pb-32 overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[2.5rem] shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center mb-2">
              <Calendar className="mr-2 text-pink-500" /> ตารางสุขภาพ
          </h1>
          <p className="text-slate-500">ประวัติการกินยาและนัดหมอ</p>
      </div>

      <div className="px-4">
        {/* Calendar Card */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
            <h2 className="text-lg font-bold text-slate-700 mb-4 px-2">เดือนนี้ (ตุลาคม)</h2>
            
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {weekDays.map(d => <div key={d} className="text-xs font-bold text-slate-400">{d}</div>)}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                    const status = getDayStatus(day);
                    const isApt = hasAppointment(day);
                    return (
                        <div key={day} className="flex flex-col items-center justify-start h-14 relative">
                            <span className={`text-sm font-medium mb-1 ${status === 'today' ? 'text-pink-600 font-bold' : 'text-slate-600'}`}>{day}</span>
                            
                            {/* Health Status Dot */}
                            {status === 'good' && <div className="w-2 h-2 rounded-full bg-green-400 mb-1"></div>}
                            {status === 'bad' && <div className="w-2 h-2 rounded-full bg-red-400 mb-1"></div>}
                            {status === 'today' && <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse mb-1"></div>}
                            
                            {/* Appointment Dot */}
                            {isApt && <div className="absolute bottom-1 w-full h-1 bg-blue-400 rounded-full"></div>}
                        </div>
                    );
                })}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-slate-500 justify-center">
                <div className="flex items-center"><div className="w-2 h-2 bg-pink-500 rounded-full mr-1 animate-pulse"></div> วันนี้</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div> ครบถ้วน</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div> ลืมกิน</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div> วันนัด</div>
            </div>
        </div>

        {/* Appointments Section */}
        <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Stethoscope className="mr-2 text-blue-500"/> นัดหมาย
            </h2>
            <button 
                onClick={() => setIsScanning(true)}
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-bold flex items-center active:scale-95 transition-all"
            >
                <Plus size={16} className="mr-1"/> เพิ่มนัด
            </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-3">
            {isProcessing && (
                <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 flex flex-col items-center justify-center animate-pulse">
                    <Loader2 className="animate-spin text-blue-500 mb-2" size={32}/>
                    <p className="text-blue-500 font-bold">กำลังอ่านใบนัด...</p>
                </div>
            )}

            {appointments.length === 0 && !isProcessing && (
                <div className="text-center p-8 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 mb-4">ยังไม่มีนัดหมายเร็วๆ นี้ค่ะ</p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-slate-600 px-6 py-3 rounded-xl font-bold shadow-sm inline-flex items-center"
                    >
                        <Camera size={20} className="mr-2"/> ถ่ายรูปใบนัด
                    </button>
                </div>
            )}

            {appointments.map(apt => (
                <div key={apt.id} className="bg-white p-5 rounded-[2rem] shadow-md border-l-8 border-blue-400 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{apt.title}</h3>
                        <div className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 font-bold text-sm">
                            {apt.date.split('-')[2]}/{apt.date.split('-')[1]}
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-slate-600">
                        <div className="flex items-center">
                            <Clock size={18} className="mr-2 text-slate-400"/> {apt.time} น.
                        </div>
                        <div className="flex items-center">
                             <MapPin size={18} className="mr-2 text-slate-400"/> {apt.location}
                        </div>
                        {apt.doctor && (
                             <div className="flex items-center text-slate-500 text-sm">
                                 <Stethoscope size={16} className="mr-2 text-slate-400"/> พบ {apt.doctor}
                            </div>
                        )}
                    </div>

                    <button className="mt-4 bg-slate-50 text-slate-500 py-2 rounded-xl font-bold text-sm hover:bg-slate-100">
                        รายละเอียด
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Hidden File Input for Direct Trigger */}
      <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
      />

      {/* Scan Modal */}
      {isScanning && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 text-center">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">เพิ่มนัดหมาย</h3>
                  <p className="text-slate-500 mb-6">เลือกวิธีเพิ่มข้อมูลนัดหมายค่ะ</p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-blue-500 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-center shadow-lg active:scale-95 transition-all"
                      >
                          <Camera className="mr-2"/> ถ่ายรูปใบนัด (AI)
                      </button>
                      
                      <button 
                        onClick={() => {
                             const mockApt: Appointment = {
                                 id: Date.now().toString(),
                                 title: "นัดติดตามอาการ",
                                 date: "2024-10-25",
                                 time: "09:00",
                                 location: "โรงพยาบาลจุฬาฯ",
                                 type: 'checkup'
                             };
                             onAddAppointment(mockApt);
                             setIsScanning(false);
                             speakText("เพิ่มนัดหมายตัวอย่างเรียบร้อยค่ะ");
                        }}
                        className="w-full bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold text-lg active:scale-95 transition-all"
                      >
                          พิมพ์เอง (ทดสอบ)
                      </button>
                  </div>

                  <button onClick={() => setIsScanning(false)} className="mt-6 text-slate-400 font-bold">ยกเลิก</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarView;
