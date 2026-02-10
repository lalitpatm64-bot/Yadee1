import React from 'react';
import { Home, MessageCircle, ScanFace, User, Calendar } from 'lucide-react';
import { ViewState } from '../types';
import { speakText } from '../constants';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode, voiceLabel: string }[] = [
    { id: 'home', label: 'กินยา', icon: <Home size={24} />, voiceLabel: 'หน้าหลัก กินยา' },
    { id: 'calendar', label: 'ตารางนัด', icon: <Calendar size={24} />, voiceLabel: 'ตารางนัดและประวัติสุขภาพ' },
    { id: 'scan', label: 'สแกน', icon: <ScanFace size={24} />, voiceLabel: 'สแกนยาหรืออาหาร' },
    { id: 'chat', label: 'คุยหมอ', icon: <MessageCircle size={24} />, voiceLabel: 'คุยกับหมอเอไอ' },
    { id: 'profile', label: 'ตั้งค่า', icon: <User size={24} />, voiceLabel: 'ข้อมูลส่วนตัว' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] safe-bottom z-50 rounded-t-[2rem]">
      <div className="flex justify-around items-center h-24 px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                speakText(item.voiceLabel);
                setView(item.id);
              }}
              className="group flex flex-col items-center justify-center w-full h-full relative"
            >
              <div 
                className={`p-3 rounded-2xl transition-all duration-300 ease-out mb-1 ${
                  isActive 
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 -translate-y-2 scale-110' 
                    : 'bg-transparent text-slate-400 group-active:scale-95'
                }`}
              >
                {item.icon}
              </div>
              <span 
                className={`text-xs font-bold transition-all duration-300 ${
                  isActive ? 'text-pink-600 opacity-100' : 'text-slate-400 opacity-70 scale-90'
                }`}
              >
                {item.label}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                 <div className="absolute bottom-2 w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;