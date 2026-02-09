import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { analyzeMedicalImage } from '../services/geminiService';

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for Gemini API if necessary, but usually inlineData accepts base64 part.
        // The API wants raw base64 usually, so let's strip the data URL prefix.
        const base64Data = base64String.split(',')[1];
        setImage(base64Data);
        setAnalysis(null); // Reset previous analysis
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    const result = await analyzeMedicalImage(image);
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
      <h2 className="text-2xl font-bold text-teal-800 text-center">ถ่ายรูปยาเพื่อตรวจสอบ</h2>
      <p className="text-slate-500 text-center text-lg">
        ถ่ายรูปเม็ดยา หรือ ฉลากยา <br/>เพื่อให้ระบบช่วยดูให้นะคะ
      </p>

      {/* Image Preview Area */}
      <div className="w-full max-w-md aspect-square bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        {image ? (
          <>
            <img 
              src={`data:image/jpeg;base64,${image}`} 
              alt="Uploaded Med" 
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
            <Camera size={64} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">แตะด้านล่างเพื่อถ่ายรูป</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-4">
        {!image ? (
            <label className="flex items-center justify-center w-full bg-teal-600 text-white py-4 rounded-2xl text-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-transform">
                <Camera className="mr-2" size={28} />
                ถ่ายรูป / เลือกรูป
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
                className={`flex items-center justify-center w-full py-4 rounded-2xl text-xl font-bold shadow-lg transition-all ${
                    loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-600 text-white active:scale-95'
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
                        ตรวจสอบยานี้
                    </>
                )}
            </button>
        )}
      </div>

      {/* Result Area */}
      {analysis && (
        <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border border-teal-100 animate-fade-in">
          <h3 className="text-xl font-bold text-teal-800 mb-2">ผลการวิเคราะห์:</h3>
          <div className="text-lg text-slate-700 whitespace-pre-line leading-relaxed">
            {analysis}
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            *ระบบอาจผิดพลาดได้ โปรดตรวจสอบกับฉลากยาหรือแพทย์อีกครั้ง
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
