import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Pill, Utensils } from 'lucide-react';
import { analyzeMedicalImage, analyzeFoodImage } from '../services/geminiService';
import { MOCK_USER } from '../constants';

type ScanMode = 'medication' | 'food';

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ScanMode>('medication');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setImage(base64Data);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    let result;
    
    if (mode === 'medication') {
        result = await analyzeMedicalImage(image);
    } else {
        result = await analyzeFoodImage(image, MOCK_USER);
    }
    
    setAnalysis(result);
    setLoading(false);
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 flex flex-col items-center space-y-6 pb-24 h-full overflow-y-auto">
      
      {/* Mode Switcher */}
      <div className="flex bg-slate-200 p-1 rounded-2xl w-full max-w-md">
        <button 
            onClick={() => { setMode('medication'); clearImage(); }}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl font-bold transition-all ${
                mode === 'medication' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:bg-slate-300/50'
            }`}
        >
            <Pill className="mr-2" size={20} />
            สแกนยา
        </button>
        <button 
            onClick={() => { setMode('food'); clearImage(); }}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl font-bold transition-all ${
                mode === 'food' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300/50'
            }`}
        >
            <Utensils className="mr-2" size={20} />
            สแกนอาหาร
        </button>
      </div>

      <div className="text-center">
        <h2 className={`text-2xl font-bold ${mode === 'medication' ? 'text-pink-800' : 'text-orange-700'}`}>
            {mode === 'medication' ? 'ตรวจสอบยา' : 'ตรวจสอบอาหาร'}
        </h2>
        <p className="text-slate-500 text-lg mt-1">
            {mode === 'medication' 
                ? 'ถ่ายรูปยาเพื่อให้ AI ช่วยบอกวิธีใช้' 
                : 'ถ่ายรูปอาหารเพื่อดูว่า "ทานได้ไหม"'}
        </p>
      </div>

      {/* Image Preview Area */}
      <div className={`w-full max-w-md aspect-square bg-slate-100 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden shadow-inner ${
          mode === 'medication' ? 'border-pink-300' : 'border-orange-300'
      }`}>
        {image ? (
          <>
            <img 
              src={`data:image/jpeg;base64,${image}`} 
              alt="Uploaded" 
              className="w-full h-full object-cover" 
            />
            <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-slate-700 shadow-md"
            >
                <X size={24} />
            </button>
          </>
        ) : (
          <div className="text-center p-6">
            <Camera size={64} className={`mx-auto mb-2 ${mode === 'medication' ? 'text-pink-200' : 'text-orange-200'}`} />
            <p className="text-slate-400">แตะเพื่อถ่ายรูป</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-4">
        {!image ? (
            <label className={`flex items-center justify-center w-full py-4 rounded-2xl text-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-transform text-white ${
                mode === 'medication' ? 'bg-pink-500' : 'bg-orange-500'
            }`}>
                <Camera className="mr-2" size={28} />
                ถ่ายรูป
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    ref={fileInputRef}
                />
            </label>
        ) : (
            <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className={`flex items-center justify-center w-full py-4 rounded-2xl text-xl font-bold shadow-lg transition-all text-white active:scale-95 ${
                    loading ? 'bg-slate-300 cursor-not-allowed' : (mode === 'medication' ? 'bg-pink-500' : 'bg-orange-500')
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 animate-spin" size={28} />
                        กำลังวิเคราะห์...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2" size={28} />
                        วิเคราะห์
                    </>
                )}
            </button>
        )}
      </div>

      {/* Result Area */}
      {analysis && (
        <div className={`w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border animate-fade-in ${
            mode === 'medication' ? 'border-pink-100' : 'border-orange-100'
        }`}>
          <h3 className={`text-xl font-bold mb-2 ${mode === 'medication' ? 'text-pink-800' : 'text-orange-800'}`}>
            ผลการวิเคราะห์:
          </h3>
          <div className="text-lg text-slate-700 whitespace-pre-line leading-relaxed">
            {analysis}
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            *ระบบ AI อาจมีข้อผิดพลาด โปรดใช้วิจารณญาณ
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;