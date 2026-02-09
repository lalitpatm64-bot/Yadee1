import React from 'react';
import { GardenState } from '../types';
import { Droplets, Sun, Cloud, Trophy, Sprout, Flower, Trees, CheckCircle2 } from 'lucide-react';

interface Props {
  garden: GardenState;
}

const GardenView: React.FC<Props> = ({ garden }) => {
  // Determine plant stage visuals
  const getPlantVisual = () => {
    switch (garden.level) {
      case 1:
        return (
          <div className="relative animate-bounce">
             <div className="w-8 h-8 bg-brown-600 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2"></div>
             <Sprout size={120} className="text-green-400 drop-shadow-xl" />
             <p className="mt-4 text-xl font-bold text-green-700">ระยะที่ 1: เมล็ดพันธุ์แห่งสุขภาพ</p>
          </div>
        );
      case 2:
        return (
          <div className="relative animate-[pulse_3s_infinite]">
             <Sprout size={160} className="text-green-500 drop-shadow-2xl" />
             <p className="mt-4 text-xl font-bold text-green-700">ระยะที่ 2: ต้นกล้าที่แข็งแรง</p>
          </div>
        );
      case 3:
        return (
           <div className="relative">
             <Trees size={200} className="text-green-600 drop-shadow-2xl" />
             <p className="mt-4 text-xl font-bold text-green-700">ระยะที่ 3: ต้นไม้ใหญ่ยืนต้น</p>
          </div>
        );
      case 4:
        return (
           <div className="relative">
             <div className="absolute top-0 right-10 animate-ping opacity-50"><Flower className="text-pink-400" size={40}/></div>
             <Trees size={220} className="text-green-700 drop-shadow-2xl" />
             <div className="absolute top-10 left-10 animate-bounce"><Flower className="text-orange-400" size={50}/></div>
             <div className="absolute top-5 right-20 animate-pulse"><Flower className="text-yellow-400" size={40}/></div>
             <p className="mt-4 text-xl font-bold text-green-700">ระยะที่ 4: ออกดอกบานสะพรั่ง</p>
          </div>
        );
      case 5:
      default:
        return (
           <div className="relative">
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl animate-bounce">🍎</div>
             <Trees size={240} className="text-emerald-700 drop-shadow-2xl" />
             <div className="absolute top-20 left-4 text-4xl animate-pulse">🍊</div>
             <div className="absolute top-10 right-8 text-4xl animate-pulse delay-700">🍎</div>
             <p className="mt-4 text-xl font-bold text-emerald-800">สุดยอด! ต้นไม้สมบูรณ์แล้ว</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-sky-200 via-blue-100 to-green-100 p-6 pb-24 overflow-y-auto relative">
      {/* Background Elements */}
      <div className="absolute top-10 right-10 text-yellow-400 animate-[spin_10s_linear_infinite]">
        <Sun size={80} fill="currentColor" />
      </div>
      <div className="absolute top-20 left-5 text-white opacity-80 animate-[pulse_5s_infinite]">
        <Cloud size={60} fill="currentColor" />
      </div>
      <div className="absolute top-40 right-20 text-white opacity-60 animate-[pulse_7s_infinite]">
        <Cloud size={40} fill="currentColor" />
      </div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-slate-700 drop-shadow-sm">สวนสุขภาพของฉัน</h1>
        <p className="text-slate-500">ยิ่งดูแลตัวเอง ต้นไม้ยิ่งโตนะคะ</p>
      </div>

      {/* Main Plant Area */}
      <div className="flex flex-col items-center justify-center min-h-[300px] mb-8 relative z-10">
        {getPlantVisual()}
      </div>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg border-2 border-white mb-6 relative z-10">
         <div className="flex justify-between items-end mb-2">
            <div>
                <span className="text-sm font-bold text-slate-500 block mb-1">ระดับความแข็งแรง (Level {garden.level})</span>
                <span className="text-3xl font-black text-blue-600">{garden.waterPoints}%</span>
            </div>
            <Droplets className="text-blue-500 animate-bounce" size={32} fill="currentColor" />
         </div>
         
         <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden border border-slate-300">
             <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{ width: `${garden.waterPoints}%` }}
             >
                <div className="w-10 h-full bg-white/20 animate-[shimmer_1s_infinite]"></div>
             </div>
         </div>
         <p className="text-center text-slate-500 text-sm mt-3">
            กินยา 1 ครั้ง = รดน้ำ 20% 💧
         </p>
      </div>

      {/* Stats / Achievements */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
         <div className="bg-white/90 p-4 rounded-2xl shadow-sm border border-green-200 flex flex-col items-center text-center">
            <div className="bg-green-100 p-3 rounded-full mb-2">
                <Trophy size={24} className="text-green-600" />
            </div>
            <h3 className="font-bold text-slate-700">ปลูกสำเร็จ</h3>
            <p className="text-2xl font-black text-green-600">{garden.totalPlantsGrown} <span className="text-sm font-normal text-slate-400">ต้น</span></p>
         </div>
         
         <div className="bg-white/90 p-4 rounded-2xl shadow-sm border border-orange-200 flex flex-col items-center text-center">
            <div className="bg-orange-100 p-3 rounded-full mb-2">
                <CheckCircle2 size={24} className="text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-700">วินัยดีเยี่ยม</h3>
            <p className="text-2xl font-black text-orange-600">ต่อเนื่อง <span className="text-sm font-normal text-slate-400">3 วัน</span></p>
         </div>
      </div>

    </div>
  );
};

export default GardenView;