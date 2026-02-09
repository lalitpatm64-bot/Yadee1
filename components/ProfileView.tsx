import React, { useState } from 'react';
import { User, Plus, Pill, Clock, FileText, Activity, Save } from 'lucide-react';
import { Medication } from '../types';
import { MOCK_USER } from '../constants';

interface Props {
  onAddMedication: (med: Medication) => void;
}

const ProfileView: React.FC<Props> = ({ onAddMedication }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    instruction: ''
  });

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
      dosage: formData.dosage || 'ตามแพทย์สั่ง',
      time: formData.time,
      instruction: formData.instruction || 'ตามแพทย์สั่ง',
      taken: false,
      type: 'pills',
      color: 'bg-white border-2 border-teal-200'
    };

    onAddMedication(newMed);
    
    // Reset form
    setFormData({ name: '', dosage: '', time: '', instruction: '' });
    setIsFormVisible(false);
  };

  return (
    <div className="p-6 pb-24 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shadow-sm">
          <User size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">{MOCK_USER.name}</h2>
          <p className="text-lg text-slate-500">อายุ {MOCK_USER.age} ปี</p>
        </div>
      </div>

      {/* Disease Info */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
          <Activity className="mr-2 text-teal-500" size={24} />
          โรคประจำตัว
        </h3>
        <p className="text-lg text-slate-600 pl-8">{MOCK_USER.condition}</p>
      </div>

      {/* Emergency Info */}
      <div className="w-full bg-red-50 p-6 rounded-3xl border border-red-100">
        <h3 className="text-xl font-bold text-red-700 mb-2">เบอร์ฉุกเฉิน</h3>
        <p className="text-3xl font-bold text-red-600">1669</p>
        <p className="text-slate-500 mt-2">ลูกสาว (นุ่น): 081-234-5678</p>
      </div>

      {/* Add Medication Section */}
      <div>
        {!isFormVisible ? (
          <button 
            onClick={() => setIsFormVisible(true)}
            className="w-full bg-teal-600 text-white p-4 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <Plus className="mr-2" size={24} />
            เพิ่มยาใหม่
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-lg border-2 border-teal-100 space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-teal-800">เพิ่มรายการยา</h3>
                <button type="button" onClick={() => setIsFormVisible(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full">
                    <Plus size={24} className="rotate-45" />
                </button>
             </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <Pill size={20} className="mr-2 text-teal-500"/> ชื่อยา
              </label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="เช่น ยาแก้แพ้, Amlodipine"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-slate-700 font-bold flex items-center text-lg">
                    <FileText size={20} className="mr-2 text-teal-500"/> ขนาด
                </label>
                <input 
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    placeholder="1 เม็ด"
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg"
                />
                </div>
                <div className="space-y-2">
                <label className="text-slate-700 font-bold flex items-center text-lg">
                    <Clock size={20} className="mr-2 text-teal-500"/> เวลา
                </label>
                <input 
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg"
                    required
                />
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-700 font-bold flex items-center text-lg">
                <FileText size={20} className="mr-2 text-teal-500"/> คำแนะนำ
              </label>
              <input 
                name="instruction"
                value={formData.instruction}
                onChange={handleChange}
                placeholder="เช่น หลังอาหาร"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-lg"
              />
            </div>

            <button 
                type="submit"
                className="w-full bg-teal-600 text-white p-4 rounded-xl font-bold text-xl mt-4 shadow-md flex items-center justify-center active:bg-teal-700 active:scale-95 transition-all"
            >
                <Save className="mr-2" size={24} />
                บันทึก
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileView;