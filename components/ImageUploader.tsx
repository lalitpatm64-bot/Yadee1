import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Pill, Utensils, Smile, Zap, Droplets, Sparkles, Volume2, Scan, RefreshCcw } from 'lucide-react';
import { analyzeMedicalImage, analyzeFoodImage, analyzeFaceHealth } from '../services/geminiService';
import { MOCK_USER, speakText } from '../constants';

type ScanMode = 'medication' | 'food' | 'face';

interface FaceMetrics {
  energyScore: number;
  moodScore: number;
  hydrationGuess: string;
  compliment: string;
  advice: string;
}

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ScanMode>('face');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // More aggressive resizing to prevent browser memory issues
  const resizeImage = (base64Str: string, maxWidth: number = 600): Promise<string> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.src = base64Str;
          img.onload = () => {
              // Calculate new dimensions
              const scale = Math.min(1, maxWidth / img.width);
              const newWidth = img.width * scale;
              const newHeight = img.height * scale;

              const canvas = document.createElement('canvas');
              canvas.width = newWidth;
              canvas.height = newHeight;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, newWidth, newHeight);
                  // Use lower quality (0.6) for faster transmission
                  resolve(canvas.toDataURL('image/jpeg', 0.6)); 
              } else {
                  resolve(base64Str); // Fallback
              }
          };
          img.onerror = () => resolve(base64Str);
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Optimization: Resize image before setting state
        const resizedBase64 = await resizeImage(base64String, 600);
        const base64Data = resizedBase64.split(',')[1];
        
        setImage(base64Data);
        setAnalysis(null);
        setFaceMetrics(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    speakText("กำลังวิเคราะห์รูปภาพ รอสักครู่นะคะ");
    
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 15000)
    );

    try {
        if (mode === 'medication') {
            const result = await Promise.race([analyzeMedicalImage(image), timeoutPromise]) as string;
            setAnalysis(result);
            speakText("วิเคราะห์เสร็จแล้วค่ะ กดปุ่มลำโพงเพื่อฟังผลได้เลย");
        } else if (mode === 'food') {
            const result = await Promise.race([analyzeFoodImage(image, MOCK_USER), timeoutPromise]) as string;
            setAnalysis(result);
            speakText("วิเคราะห์อาหารเสร็จแล้วค่ะ");
        } else if (mode === 'face') {
            const jsonResult = await Promise.race([analyzeFaceHealth(image), timeoutPromise]) as string;
            try {
                const cleanJson = jsonResult.replace(/```json/g, '').replace(/```/g, '').trim();
                const metrics = JSON.parse(cleanJson);
                setFaceMetrics(metrics);
                speakText(`คุณยายดูสดใสจังเลยค่ะ ${metrics.compliment}`);
            } catch (e) {
                setAnalysis("ขออภัยค่ะ ไม่สามารถประมวลผลใบหน้าได้ ลองถ่ายใหม่นะคะ");
            }
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        setAnalysis("ขออภัยค่ะ ระบบใช้เวลานานเกินไป โปรดลองถ่ายใหม่อีกครั้งให้ชัดเจนขึ้นนะคะ");
        speakText("ระบบใช้เวลานานเกินไป ลองถ่ายใหม่นะคะ");
    } finally {
        setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
    setFaceMetrics(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderScanButton = (scanMode: ScanMode, label: string, icon: React.ReactNode, colorClass: string, activeColor: string) => (
    <button 
        onClick={() => { setMode(scanMode); clearImage(); speakText(label); }}
        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl font-bold transition-all ${
            mode === scanMode 
            ? `bg-white ${activeColor} shadow-md scale-105 ring-2 ring-offset-2 ring-slate-100` 
            : 'text-slate-400 hover:bg-slate-200/50'
        }`}
    >
        <div className="mb-1">{icon}</div>
        <span className="text-xs">{label}</span>
    </button>
  );

  return (
    // Outer container handles the scroll for the entire view
    <div className="h-full overflow-y-auto bg-slate-50 pb-32">
        <div className="p-4 flex flex-col items-center space-y-6 min-h-full">
        
        {/* Mode Switcher */}
        <div className="flex bg-slate-200 p-1.5 rounded-3xl w-full max-w-md gap-1 flex-none">
            {renderScanButton('face', 'สแกนหน้า', <Smile size={24}/>, 'text-purple-600', 'text-purple-600')}
            {renderScanButton('medication', 'สแกนยา', <Pill size={24}/>, 'text-pink-600', 'text-pink-600')}
            {renderScanButton('food', 'สแกนอาหาร', <Utensils size={24}/>, 'text-orange-600', 'text-orange-600')}
        </div>

        <div className="text-center animate-fade-in flex-none">
            <h2 className={`text-3xl font-bold ${
                mode === 'face' ? 'text-purple-800' : mode === 'medication' ? 'text-pink-800' : 'text-orange-800'
            }`}>
                {mode === 'face' ? 'กระจกวิเศษ AI ✨' : mode === 'medication' ? 'ผู้ช่วยสแกนยา 💊' : 'นักโภชนาการ 🥗'}
            </h2>
            <p className="text-slate-500 text-base mt-2 px-6">
                {mode === 'face' 
                    ? 'เช็คพลังงานและความสดใสของคุณวันนี้' 
                    : mode === 'medication' 
                        ? 'ถ่ายรูปซองยาหรือเม็ดยาเพื่อดูวิธีใช้' 
                        : 'ถ่ายรูปอาหารเพื่อดูว่าเหมาะกับสุขภาพไหม'}
            </p>
        </div>

        {/* Image Preview Area */}
        <div className={`w-full max-w-md aspect-square bg-slate-100 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-colors flex-none ${
            mode === 'face' ? 'border-purple-300' : mode === 'medication' ? 'border-pink-300' : 'border-orange-300'
        }`}>
            {image ? (
            <>
                <img 
                src={`data:image/jpeg;base64,${image}`} 
                alt="Uploaded" 
                className={`w-full h-full object-cover ${mode === 'face' ? 'scale-x-[-1]' : ''}`} // Mirror effect for selfie
                />
                {/* Overlay Scan Effect when Loading */}
                {loading && (
                    <div className="absolute inset-0 bg-black/30 z-10 flex flex-col items-center justify-center">
                        <Loader2 className="text-white w-16 h-16 animate-spin mb-4" />
                        <div className="bg-white/90 px-6 py-2 rounded-full text-slate-800 font-bold animate-pulse">
                            กำลังวิเคราะห์...
                        </div>
                    </div>
                )}
                <button 
                    onClick={clearImage}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-slate-700 shadow-xl backdrop-blur-sm z-20"
                >
                    <X size={24} />
                </button>
            </>
            ) : (
            <div className="text-center p-6">
                <div className={`inline-block p-6 rounded-full mb-4 ${
                    mode === 'face' ? 'bg-purple-100 text-purple-400' : mode === 'medication' ? 'bg-pink-100 text-pink-400' : 'bg-orange-100 text-orange-400'
                }`}>
                    <Camera size={48} />
                </div>
                <p className="text-slate-400 font-medium">แตะปุ่มด้านล่างเพื่อถ่ายรูป</p>
            </div>
            )}
        </div>

        {/* Controls */}
        <div className="w-full max-w-md space-y-4 flex-none">
            {!image ? (
                <label className={`flex items-center justify-center w-full py-5 rounded-3xl text-xl font-bold shadow-xl cursor-pointer active:scale-95 transition-transform text-white ${
                    mode === 'face' ? 'bg-purple-600' : mode === 'medication' ? 'bg-pink-500' : 'bg-orange-500'
                }`}>
                    <Camera className="mr-2" size={28} />
                    {mode === 'face' ? 'ถ่ายเซลฟี่ (Selfie)' : 'ถ่ายรูป'}
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture={mode === 'face' ? 'user' : 'environment'} // Force selfie cam for face mode
                        className="hidden" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                    />
                </label>
            ) : (
                !faceMetrics && !analysis && (
                    <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className={`flex items-center justify-center w-full py-5 rounded-3xl text-xl font-bold shadow-xl transition-all text-white active:scale-95 ${
                            loading ? 'bg-slate-300 cursor-not-allowed' : (mode === 'face' ? 'bg-purple-600' : mode === 'medication' ? 'bg-pink-500' : 'bg-orange-500')
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" size={28} />
                                รอสักครู่...
                            </>
                        ) : (
                            <>
                                <Scan className="mr-2" size={28} />
                                เริ่มวิเคราะห์
                            </>
                        )}
                    </button>
                )
            )}
        </div>

        {/* Result Area: Face Metrics (Futuristic HUD) */}
        {faceMetrics && (
            <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out] flex-none">
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-purple-100 relative">
                    {/* Decorative Top Bar */}
                    <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
                    
                    <div className="p-6 space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                <Sparkles className="text-yellow-400 fill-yellow-400" /> 
                                ผลลัพธ์สุขภาพ
                            </h3>
                            <button onClick={() => speakText(`พลังงาน ${faceMetrics.energyScore} เปอร์เซ็นต์, ความสดใส ${faceMetrics.moodScore} เปอร์เซ็นต์, ${faceMetrics.compliment}, ${faceMetrics.advice}`)} className="mx-auto mt-2 bg-purple-100 text-purple-600 p-2 rounded-full">
                                <Volume2 size={24} />
                            </button>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-4">
                            {/* Energy */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-600 flex items-center"><Zap size={18} className="mr-1 text-yellow-500"/> พลังงาน (Energy)</span>
                                    <span className="font-bold text-slate-800">{faceMetrics.energyScore}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${faceMetrics.energyScore}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Mood */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-600 flex items-center"><Smile size={18} className="mr-1 text-pink-500"/> ความสดใส (Mood)</span>
                                    <span className="font-bold text-slate-800">{faceMetrics.moodScore}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-pink-400 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out delay-100" 
                                        style={{ width: `${faceMetrics.moodScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Compliment Card */}
                        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 text-center relative mt-4">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold text-purple-600 border border-purple-100 uppercase tracking-wider">
                                AI Comment
                            </div>
                            <p className="text-lg font-medium text-purple-800 italic leading-relaxed">
                                "{faceMetrics.compliment}"
                            </p>
                        </div>

                        {/* Advice */}
                        <div className="flex items-start bg-slate-50 p-4 rounded-2xl">
                            <div className="bg-white p-2 rounded-full shadow-sm mr-3 text-blue-500">
                                <Droplets size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm mb-1">คำแนะนำสุขภาพ</h4>
                                <p className="text-slate-600 leading-snug">{faceMetrics.advice}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={clearImage} className="w-full mt-4 py-3 text-slate-500 font-medium hover:text-slate-700 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <RefreshCcw className="mr-2" size={20}/> สแกนใหม่อีกครั้ง
                </button>
            </div>
        )}

        {/* Result Area: Standard Text Analysis */}
        {analysis && (
            <div className={`w-full max-w-md bg-white p-6 rounded-[2rem] shadow-xl border animate-fade-in flex-none ${
                mode === 'medication' ? 'border-pink-100' : 'border-orange-100'
            }`}>
            <h3 className={`text-xl font-bold mb-3 flex items-center ${mode === 'medication' ? 'text-pink-800' : 'text-orange-800'}`}>
                {mode === 'medication' ? <Pill className="mr-2"/> : <Utensils className="mr-2"/>}
                ผลการวิเคราะห์
                <button onClick={() => speakText(analysis)} className="ml-auto bg-slate-100 p-2 rounded-full text-slate-600">
                    <Volume2 size={24} />
                </button>
            </h3>
            <div className="text-lg text-slate-700 whitespace-pre-line leading-relaxed">
                {analysis}
            </div>
            <button onClick={clearImage} className="w-full mt-6 bg-slate-100 py-3 rounded-xl font-bold text-slate-600 flex items-center justify-center">
                   <RefreshCcw className="mr-2" size={20}/> ตกลง / สแกนใหม่
            </button>
            </div>
        )}
        </div>
    </div>
  );
};

export default ImageUploader;