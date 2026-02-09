import React from 'react';
import { Home, MessageCircle, Camera, User } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: <Home size={30} /> },
    { id: 'chat', label: 'คุยกับหมอ', icon: <MessageCircle size={30} /> },
    { id: 'scan', label: 'สแกนยา', icon: <Camera size={30} /> },
    { id: 'profile', label: 'ข้อมูลฉัน', icon: <User size={30} /> },
  ];

  return (
    // Use 'safe-bottom' class defined in index.html styles instead of 'pb-safe' (which isn't in default tailwind)
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-bottom z-50">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              currentView === item.id ? 'text-pink-600 bg-pink-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className={currentView === item.id ? 'scale-110 transition-transform' : ''}>
                {item.icon}
            </div>
            <span className={`text-base font-bold ${currentView === item.id ? 'text-pink-700' : 'text-slate-500'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;