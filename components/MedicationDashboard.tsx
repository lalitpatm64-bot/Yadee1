import React, { useState, useRef } from 'react';
import { Medication, UserProfile, VitalSigns } from '../types';
import { CheckCircle, Circle, Sun, Moon, Coffee, Phone, Activity, Edit3, X, Save, Pill, Share2, Sparkles, Smile, Meh, Frown, Copy, Sunrise, ChevronRight, AlertCircle, Volume2, Camera, RefreshCcw, ScanLine, AlertTriangle, Loader2 } from 'lucide-react';
import { generateDailyReport, verifyPill } from '../services/geminiService';
import { speakText } from '../constants';

interface Props {
  user: UserProfile;
  medications: Medication[];
  vitals: VitalSigns;
  onUpdateVitals: (vitals: Partial<VitalSigns>) => void;
  onToggleMed: (id: string, photo?: string) => void;
  isCheckedIn: boolean; 
  onCheckIn: () => void; 
}

const MedicationDashboard: React.FC<Props> = ({ user, medications, vitals, onUpdateVitals, onToggleMed, isCheckedIn, onCheckIn }) => {
  const [editingVital, setEditingVital] = useState<'pressure' | 'sugar' | null>(null);
  
  // State for "Photo Proof" Modal
  const [activeMedForCamera, setActiveMedForCamera] = useState<Medication | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{isMatch: boolean, reason: string} | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for Viewing Taken Photo
  const [viewingPhotoMed, setViewingPhotoMed] = useState<Medication | null>(null);

  const [mood, setMood] = useState<string>('Happy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const [tempSys, setTempSys] = useState(vitals.systolic.toString());
  const [tempDia, setTempDia] = useState(vitals.diastolic.toString());
  const [tempSugar, setTempSugar] = useState(vitals.sugar.toString());

  const takenCount = medications.filter(m => m.taken).length;
  const totalCount = medications.length;
  const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "อรุณสวัสดิ์";
    if (hour < 16) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  // --- CAMERA LOGIC ---
  const startCamera = async (med: Medication) => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 }, // Limit resolution request
                height: { ideal: 720 }
            } 
          });
          setCameraStream(stream);
          setActiveMedForCamera(med);
          setVerificationResult(null);
          setPendingPhoto(null);
          speakText(`ถ่ายรูปยา ${med.commonName} ในมือ เพื่อกันลืมนะคะ`);
      } catch (e) {
          alert("ไม่สามารถเปิดกล้องได้");
          // Fallback if camera fails: just toggle without photo
          onToggleMed(med.id);
      }
  };

  const stopCamera = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
      setActiveMedForCamera(null);
      setVerificationResult(null);
      setPendingPhoto(null);
  };

  const capturePhoto = async () => {
      if (videoRef.current && activeMedForCamera) {
          // PERFORMANCE TUNING: Resize image to max 800px width
          const MAX_WIDTH = 800;
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          const scale = Math.min(1, MAX_WIDTH / videoWidth);

          const canvas = document.createElement('canvas');
          canvas.width = videoWidth * scale;
          canvas.height = videoHeight * scale;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }
          
          // Use slightly lower quality for faster upload (0.7 is still very good)
          const photoBase64 = canvas.toDataURL('image/jpeg', 0.7);
          const base64Data = photoBase64.split(',')[1];

          setPendingPhoto(photoBase64);
          
          // Start AI Verification
          setIsVerifying(true);
          speakText("กำลังให้เอไอช่วยดูยานะคะ รอสักครู่");
          
          const result = await verifyPill(base64Data, activeMedForCamera.name, activeMedForCamera.appearance || "ยา");
          
          setIsVerifying(false);
          setVerificationResult(result);
          
          if (result.isMatch) {
              speakText("ยาถูกต้องค่ะ เก่งมาก กดปุ่มยืนยันได้เลย");
          } else {
              speakText("เอไอสงสัยว่ายาอาจจะไม่ตรง ลองตรวจสอบอีกครั้งนะคะ");
          }
      }
  };
  
  const confirmTaken = () => {
      if (activeMedForCamera && pendingPhoto) {
          onToggleMed(activeMedForCamera.id, pendingPhoto);
          speakText("บันทึกการกินยาเรียบร้อยค่ะ");
          stopCamera();
      }
  };

  const retryPhoto = () => {
      setVerificationResult(null);
      setPendingPhoto(null);
      speakText("ถ่ายใหม่นะคะ");
  };

  const handleMedClick = (med: Medication) => {
      if (med.taken) {
          // If already taken, show the photo or ask to undo
          setViewingPhotoMed(med);
          speakText(`ยานี้กินไปแล้วเมื่อกี้ค่ะ`);
      } else {
          // Open camera to take
          startCamera(med);
      }
  };

  const handleUndoTaken = () => {
      if (viewingPhotoMed) {
          onToggleMed(viewingPhotoMed.id); // Toggle back to false
          setViewingPhotoMed(null);
          speakText("ยกเลิกการกินยาแล้วค่ะ");
      }
  };

  const handleSaveVitals = () => {
    if (editingVital === 'pressure') {
        onUpdateVitals({
            systolic: parseInt(tempSys),
            diastolic: parseInt(tempDia)
        });
        speakText(`บันทึกความดัน ${tempSys} ตัวล่าง ${tempDia} เรียบร้อยแล้วค่ะ`);
    } else if (editingVital === 'sugar') {
        onUpdateVitals({
            sugar: parseInt(tempSugar)
        });
        speakText(`บันทึกค่าน้ำตาล ${tempSugar} เรียบร้อยแล้วค่ะ`);
    }
    setEditingVital(null);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    speakText("กำลังเขียนข้อความถึงลูกหลาน รอสักครู่นะคะ");
    const text = await generateDailyReport(user, medications, vitals, mood);
    setReportText(text);
    setIsGenerating(false);
    speakText("เขียนเสร็จแล้วค่ะ กดปุ่มสีเขียวเพื่อส่งไลน์ได้เลย");
  };

  const copyToClipboard = () => {
    if (reportText) {
        navigator.clipboard.writeText(reportText);
        alert('คัดลอกข้อความเรียบร้อยแล้ว ส่งในไลน์ได้เลยค่ะ!');
        speakText("คัดลอกแล้วค่ะ เปิดไลน์แล้ววางส่งได้เลย");
    }
  };

  const getPressureColor = (sys: number, dia: number) => {
      if (sys > 140 || dia > 90) return 'from-red-50 to-red-100 text-red-800 border-red-200';
      if (sys > 120 || dia > 80) return 'from-orange-50 to-orange-100 text-orange-800 border-orange-200';
      return 'from-green-50 to-green-100 text-green-800 border-green-200';
  };

  const getSugarColor = (sugar: number) => {
      if (sugar > 125) return 'from-red-50 to-red-100 text-red-800 border-red-200'; 
      if (sugar > 100) return 'from-orange-50 to-orange-100 text-orange-800 border-orange-200'; 
      return 'from-green-50 to-green-100 text-green-800 border-green-200'; 
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 relative pb-32">
      
      {/* 1. CAMERA MODAL (Taking the med) */}
      {activeMedForCamera && (
        <div className="fixed inset-0 z-[80] bg-black flex flex-col items-center justify-center">
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
                <div className="bg-black/50 px-4 py-2 rounded-full text-white font-bold backdrop-blur-md">
                    {pendingPhoto ? 'ตรวจสอบความถูกต้อง' : `ถ่ายรูปยา: ${activeMedForCamera.commonName}`}
                </div>
                <button onClick={stopCamera} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>
            
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {!pendingPhoto ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            onLoadedMetadata={() => videoRef.current?.play()}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border-[3rem] border-black/50 pointer-events-none flex items-center justify-center">
                            <div className="border-2 border-white/50 w-64 h-64 rounded-2xl animate-pulse"></div>
                        </div>
                        <div className="absolute bottom-10 w-full flex justify-center items-center gap-8">
                             <button 
                                onClick={capturePhoto}
                                className="w-24 h-24 bg-white rounded-full border-8 border-slate-300 shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                            >
                                <Camera size={40} className="text-slate-400"/>
                            </button>
                        </div>
                        <p className="absolute bottom-36 text-white font-bold text-lg shadow-black drop-shadow-md">แตะปุ่มสีขาวเพื่อถ่ายรูปยืนยัน</p>
                    </>
                ) : (
                    // POST-CAPTURE / VERIFICATION STATE
                    <div className="relative w-full h-full flex flex-col bg-slate-900">
                        <img src={pendingPhoto} className="w-full h-1/2 object-cover opacity-80" alt="preview"/>
                        
                        <div className="flex-1 bg-white rounded-t-[2.5rem] -mt-10 relative z-20 p-6 flex flex-col items-center text-center">
                            {isVerifying ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Loader2 size={64} className="text-pink-500 animate-spin mb-4"/>
                                    <h3 className="text-2xl font-bold text-slate-700">AI กำลังตรวจสอบยา...</h3>
                                    <p className="text-slate-400">รอสักครู่นะคะคนเก่ง</p>
                                </div>
                            ) : verificationResult ? (
                                <div className="animate-fade-in w-full h-full flex flex-col">
                                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${verificationResult.isMatch ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                         {verificationResult.isMatch ? <CheckCircle size={48}/> : <AlertTriangle size={48}/>}
                                     </div>
                                     
                                     <h3 className={`text-2xl font-bold mb-2 ${verificationResult.isMatch ? 'text-green-700' : 'text-orange-700'}`}>
                                         {verificationResult.isMatch ? 'ยาถูกต้องค่ะ!' : 'เอ๊ะ! ไม่ค่อยแน่ใจ?'}
                                     </h3>
                                     
                                     <p className="text-slate-500 text-lg mb-6 bg-slate-50 p-4 rounded-xl">
                                         "{verificationResult.reason}"
                                     </p>

                                     <div className="mt-auto space-y-3 w-full">
                                         <button 
                                            onClick={confirmTaken}
                                            className={`w-full py-4 rounded-2xl font-bold text-xl text-white shadow-lg active:scale-95 transition-all flex items-center justify-center ${verificationResult.isMatch ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                                         >
                                             {verificationResult.isMatch ? <CheckCircle className="mr-2"/> : <AlertTriangle className="mr-2"/>}
                                             {verificationResult.isMatch ? 'ยืนยัน (กินแล้ว)' : 'ยืนยัน (กินตัวนี้แหละ)'}
                                         </button>
                                         <button 
                                            onClick={retryPhoto}
                                            className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg"
                                         >
                                             ถ่ายใหม่
                                         </button>
                                     </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 2. PHOTO VIEW MODAL (Checking history) */}
      {viewingPhotoMed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">
                    บันทึกการกินยา
                </h3>
                
                <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-4 border-2 border-slate-200 relative">
                    {viewingPhotoMed.takenPhoto ? (
                        <img src={viewingPhotoMed.takenPhoto} alt="Proof" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle size={64} className="mb-2 text-green-500"/>
                            <span>ไม่ได้ถ่ายรูปไว้</span>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full bg-black/50 text-white py-1 text-sm">
                        {viewingPhotoMed.takenTime ? viewingPhotoMed.takenTime.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : ''} น.
                    </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl w-full mb-6 border border-green-100">
                     <p className="text-green-800 font-bold text-lg">
                        กิน {viewingPhotoMed.commonName} เรียบร้อยแล้วค่ะ
                     </p>
                </div>

                <div className="flex gap-3 w-full">
                    <button 
                        onClick={handleUndoTaken}
                        className="flex-1 bg-red-100 text-red-600 p-4 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center"
                    >
                        <RefreshCcw className="mr-2" size={20} />
                        ยังไม่ได้กิน (ยกเลิก)
                    </button>
                    <button 
                        onClick={() => setViewingPhotoMed(null)}
                        className="flex-1 bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold text-lg hover:bg-slate-200"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Vitals Modal */}
      {editingVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-bold text-slate-800">
                        {editingVital === 'pressure' ? 'ความดัน' : 'น้ำตาล'}
                    </h3>
                    <button onClick={() => setEditingVital(null)} className="p-3 bg-slate-100 rounded-full text-slate-500">
                        <X size={32} />
                    </button>
                </div>

                <div className="space-y-8">
                    {editingVital === 'pressure' ? (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold text-xl">ตัวบน</label>
                                <input 
                                    type="number" 
                                    value={tempSys}
                                    onChange={(e) => setTempSys(e.target.value)}
                                    className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center pt-8 text-4xl text-slate-300">/</div>
                            <div className="flex-1">
                                <label className="block text-slate-500 mb-2 font-bold text-xl">ตัวล่าง</label>
                                <input 
                                    type="number" 
                                    value={tempDia}
                                    onChange={(e) => setTempDia(e.target.value)}
                                    className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                             <label className="block text-slate-500 mb-2 font-bold text-xl">ค่าน้ำตาล</label>
                             <input 
                                type="number" 
                                value={tempSugar}
                                onChange={(e) => setTempSugar(e.target.value)}
                                className="w-full p-6 bg-slate-50 rounded-3xl text-4xl font-bold text-center border-2 border-slate-200 focus:border-green-500 focus:outline-none"
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleSaveVitals}
                        className="w-full bg-pink-500 text-white p-6 rounded-[1.5rem] font-bold text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Save className="mr-3" size={32} />
                        บันทึก
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. Report Modal */}
      {reportText && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                      <Sparkles className="text-yellow-400 mr-2" size={32}/> 
                      ข้อความถึงลูกหลาน
                  </h3>
                  <div className="bg-pink-50 p-6 rounded-[1.5rem] text-xl text-slate-700 leading-relaxed border-2 border-pink-100 mb-6 font-medium">
                      "{reportText}"
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setReportText(null)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl text-lg">ปิด</button>
                      <button onClick={copyToClipboard} className="flex-[2] bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 flex items-center justify-center text-lg">
                          <Copy className="mr-2" size={24}/> คัดลอกส่งไลน์
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- HEADER SECTION --- */}
      <header className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-sm relative z-10 border-b border-slate-100">
        <div className="flex justify-between items-start">
            <div onClick={() => speakText(`${getGreeting()}ค่ะ ${user.name} วันนี้ทานยาไปแล้ว ${percentage} เปอร์เซ็นต์ค่ะ`)}>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    {getGreeting()} <Sun className="ml-2 text-orange-400" size={32} />
                </h1>
                <p className="text-xl text-slate-500 mt-1 font-medium">{user.name}</p>
            </div>
            <div className="bg-pink-50 p-2 rounded-full border border-pink-100">
                 <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {percentage}%
                 </div>
            </div>
        </div>
        
        {/* Morning Check-in (Prominent) */}
        {!isCheckedIn && (
            <button 
                onClick={() => {
                    onCheckIn();
                    speakText("อรุณสวัสดิ์ค่ะ แจ้งเตือนลูกหลานเรียบร้อยแล้ว");
                }}
                className="w-full mt-6 bg-gradient-to-r from-orange-400 to-amber-500 text-white p-6 rounded-[2rem] shadow-lg shadow-orange-200 flex items-center justify-between active:scale-95 transition-all animate-[pulse_3s_infinite]"
            >
                <div className="flex items-center">
                    <div className="bg-white/20 p-3 rounded-full mr-4">
                        <Sunrise size={32} className="text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-2xl">กดเช็คอินตอนเช้า</p>
                        <p className="text-orange-100 text-lg">บอกลูกหลานว่าตื่นแล้ว</p>
                    </div>
                </div>
                <ChevronRight size={32} className="opacity-80"/>
            </button>
        )}
      </header>

      <div className="p-4 space-y-6 mt-2">
        
        {/* --- SUMMARY & MOOD --- */}
        <div className="flex gap-4">
             {/* Mood Selector */}
             <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <span className="text-slate-400 font-bold mb-2 text-sm">อารมณ์วันนี้</span>
                <div className="flex gap-2 w-full justify-around">
                     <button onClick={() => { setMood('Happy'); speakText('วันนี้สดใสดีจังค่ะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Happy' ? 'bg-green-100 text-green-600 scale-110' : 'text-slate-300'}`}><Smile size={32}/></button>
                     <button onClick={() => { setMood('Neutral'); speakText('วันนี้รู้สึกเฉยๆ นะคะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Neutral' ? 'bg-yellow-100 text-yellow-600 scale-110' : 'text-slate-300'}`}><Meh size={32}/></button>
                     <button onClick={() => { setMood('Sick'); speakText('วันนี้ไม่ค่อยสบาย หายไวๆ นะคะ'); }} className={`p-2 rounded-2xl transition-all ${mood === 'Sick' ? 'bg-red-100 text-red-600 scale-110' : 'text-slate-300'}`}><Frown size={32}/></button>
                </div>
             </div>
             
             {/* Simple Compliance */}
             <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden" onClick={() => speakText(`ทานยาไปแล้ว ${takenCount} จาก ${totalCount} เม็ดค่ะ`)}>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent"></div>
                <span className="text-slate-400 font-bold mb-1 text-sm relative z-10">ยาที่กินแล้ว</span>
                <span className="text-4xl font-black text-pink-500 relative z-10">{takenCount}<span className="text-lg text-slate-300 font-bold">/{totalCount}</span></span>
             </div>
        </div>

        {/* --- VITALS (BIG CARDS) --- */}
        <div>
            <h2 className="text-xl font-bold text-slate-600 mb-3 ml-2 flex items-center">
                <Activity className="mr-2 text-blue-500" size={24}/> สุขภาพวันนี้
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => { 
                        setTempSys(vitals.systolic.toString()); 
                        setTempDia(vitals.diastolic.toString()); 
                        setEditingVital('pressure'); 
                        speakText(`ความดันล่าสุด ${vitals.systolic} กับ ${vitals.diastolic} กดเพื่อแก้ไขค่ะ`);
                    }}
                    className={`p-5 rounded-[2rem] border-2 bg-gradient-to-br shadow-sm active:scale-95 transition-all text-left flex flex-col justify-between h-36 ${getPressureColor(vitals.systolic, vitals.diastolic)}`}
                >
                    <div className="flex justify-between items-start opacity-70">
                        <span className="font-bold text-lg">ความดัน</span>
                        <Edit3 size={20} />
                    </div>
                    <div className="self-center text-center">
                        <span className="text-3xl font-black block">{vitals.systolic}</span>
                        <div className="w-12 h-1 bg-current opacity-30 mx-auto my-1 rounded-full"></div>
                        <span className="text-3xl font-black block">{vitals.diastolic}</span>
                    </div>
                </button>

                <button 
                    onClick={() => { 
                        setTempSugar(vitals.sugar.toString()); 
                        setEditingVital('sugar'); 
                        speakText(`ค่าน้ำตาลล่าสุด ${vitals.sugar} กดเพื่อแก้ไขค่ะ`);
                    }}
                    className={`p-5 rounded-[2rem] border-2 bg-gradient-to-br shadow-sm active:scale-95 transition-all text-left flex flex-col justify-between h-36 ${getSugarColor(vitals.sugar)}`}
                >
                    <div className="flex justify-between items-start opacity-70">
                        <span className="font-bold text-lg">น้ำตาล</span>
                        <Edit3 size={20} />
                    </div>
                    <div className="self-center text-center mt-2">
                        <span className="text-5xl font-black block">{vitals.sugar}</span>
                        <span className="text-sm font-bold opacity-60">mg/dL</span>
                    </div>
                </button>
            </div>
        </div>

        {/* --- MEDICATION LIST (THE CORE) --- */}
        <div>
            <h2 className="text-xl font-bold text-slate-600 mb-3 ml-2 flex items-center">
                <Pill className="mr-2 text-pink-500" size={24}/> ยาที่ต้องกิน
            </h2>
            <div className="space-y-4">
            {medications.map((med) => (
                <div 
                key={med.id} 
                onClick={() => handleMedClick(med)}
                className={`relative overflow-hidden group p-1 rounded-[2rem] transition-all cursor-pointer active:scale-[0.98] shadow-sm ${
                    med.taken ? 'bg-slate-100' : 'bg-white shadow-md hover:shadow-lg'
                }`}
                >
                <div className={`absolute left-0 top-0 bottom-0 w-3 ${med.taken ? 'bg-slate-300' : 'bg-pink-500'}`}></div>
                <div className="flex items-center p-5 pl-6">
                    {/* Icon Status */}
                    <div className={`mr-5 transition-all duration-300 flex-none ${med.taken ? 'scale-90' : 'scale-105'}`}>
                        {med.taken ? (
                            med.takenPhoto ? (
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-green-400 shadow-sm relative">
                                    <img src={med.takenPhoto} className="w-full h-full object-cover" alt="taken" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <CheckCircle size={24} className="text-white drop-shadow-md"/>
                                    </div>
                                </div>
                            ) : (
                                <CheckCircle size={48} className="text-slate-400" />
                            )
                        ) : (
                            <div className="w-16 h-16 rounded-full border-4 border-pink-200 flex items-center justify-center bg-pink-50 text-pink-500">
                                <Camera size={28} className="animate-pulse"/>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-2xl font-bold leading-tight truncate pr-2 ${med.taken ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {med.commonName || med.name}
                            </h3>
                            
                            {/* Audio Helper Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const text = `ยา ${med.commonName || med.name}, กิน ${med.dosage}, ${med.instruction}, เวลา ${med.time}`;
                                    speakText(text);
                                }}
                                className="ml-2 bg-pink-100 text-pink-600 p-2 rounded-full active:scale-95 hover:bg-pink-200 flex-none"
                            >
                                <Volume2 size={24} />
                            </button>

                            {med.totalQuantity !== undefined && med.totalQuantity <= (med.reorderThreshold || 5) && !med.taken && (
                                <div className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center whitespace-nowrap ml-2">
                                    <AlertCircle size={12} className="mr-1"/> ใกล้หมด
                                </div>
                            )}
                        </div>
                        
                        <p className={`text-lg font-medium mb-2 ${med.taken ? 'text-slate-400' : 'text-slate-600'}`}>
                            {med.dosage}
                        </p>
                        
                        {!med.taken ? (
                            <div className="inline-flex items-center bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600 font-bold text-sm">
                                {med.time < "10:00" ? <Sun size={16} className="mr-1 text-orange-500"/> : med.time > "18:00" ? <Moon size={16} className="mr-1 text-purple-500"/> : <Coffee size={16} className="mr-1 text-brown-500"/>}
                                {med.time} น. — {med.instruction}
                            </div>
                        ) : (
                            <div className="text-sm text-green-600 font-bold flex items-center">
                                กินแล้ว {med.takenTime?.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.
                            </div>
                        )}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* --- FAMILY CONNECT & EMERGENCY --- */}
        <div className="grid grid-cols-5 gap-3 pt-2">
            <button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="col-span-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-[2rem] flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all"
            >
                {isGenerating ? <span className="animate-pulse">กำลังเขียน...</span> : <><Share2 className="mr-2" size={24} /> ส่งไลน์ให้ลูก</>}
            </button>

            <a href="tel:1669" className="col-span-2 bg-red-100 text-red-600 p-5 rounded-[2rem] flex flex-col items-center justify-center font-bold text-lg border-2 border-red-200 active:scale-95 transition-all">
                <Phone size={28} className="mb-1"/>
                <span>ฉุกเฉิน</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default MedicationDashboard;