import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import MedicationDashboard from './components/MedicationDashboard';
import ChatInterface from './components/ChatInterface';
import ImageUploader from './components/ImageUploader';
import ProfileView from './components/ProfileView';
import SafetyNetSystem from './components/SafetyNetSystem';
import CalendarView from './components/CalendarView';
import { ViewState, ChatMessage, Medication, VitalSigns, Appointment } from './types';
import { INITIAL_MEDICATIONS, MOCK_USER, CAREGIVER_CONTACT } from './constants';
import { Package, AlarmClock, PhoneOutgoing, ShoppingBag } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('home');
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [customVoiceUrl, setCustomVoiceUrl] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // New State for Vitals
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: 128,
    diastolic: 80,
    sugar: 105,
    lastUpdated: new Date()
  });

  // State for Low Stock Alert Modal
  const [lowStockAlert, setLowStockAlert] = useState<Medication | null>(null);

  // Morning Check-in State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInAlertLevel, setCheckInAlertLevel] = useState<'idle' | 'warning'>('idle');
  const [autoCallCountdown, setAutoCallCountdown] = useState<number | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Morning Check-in Logic ---
  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInAlertLevel('idle');
    setAutoCallCountdown(null);
    showToast("🌞 อรุณสวัสดิ์ค่ะ! วันนี้ขอให้สดใสนะคะ");
  };

  const simulateOversleep = () => {
      setIsCheckedIn(false);
      setCheckInAlertLevel('warning');
      // Start auto-call countdown immediately for demo urgency
      setAutoCallCountdown(10);
  };

  const cancelCheckInAlert = () => {
      setCheckInAlertLevel('idle');
      setAutoCallCountdown(null);
      // We don't mark as checked in, just dismiss the alert
  };

  // --- Auto Call Countdown Effect for Morning Check-in ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (autoCallCountdown !== null && autoCallCountdown > 0) {
        timer = setTimeout(() => {
            setAutoCallCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
    } else if (autoCallCountdown === 0) {
        window.location.href = `tel:${CAREGIVER_CONTACT}`;
        setAutoCallCountdown(null); 
    }
    return () => clearTimeout(timer);
  }, [autoCallCountdown]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateVitals = (newVitals: Partial<VitalSigns>) => {
    setVitals(prev => ({
        ...prev,
        ...newVitals,
        lastUpdated: new Date()
    }));
  };

  const toggleMedication = (id: string, photo?: string) => {
    setMedications(prev => 
      prev.map(med => {
         if (med.id === id) {
             const isTaking = !med.taken;
             let newQuantity = med.totalQuantity;
             
             // Logic: If taking, quantity - 1. If untaking (mistake), quantity + 1.
             if (isTaking && newQuantity !== undefined) {
                newQuantity = Math.max(0, newQuantity - 1);
             } else if (!isTaking && newQuantity !== undefined) {
                newQuantity = newQuantity + 1;
             }
             
             // Check for low stock immediately after taking
             if (isTaking && newQuantity !== undefined && med.reorderThreshold !== undefined && newQuantity <= med.reorderThreshold) {
                 setLowStockAlert({ ...med, totalQuantity: newQuantity });
             }

             if (isTaking) {
                 showToast(`เก่งมากค่ะ! ทานยาเรียบร้อยแล้ว`);
             }

             return { 
                 ...med, 
                 taken: isTaking, 
                 takenTime: isTaking ? new Date() : undefined,
                 takenPhoto: isTaking && photo ? photo : undefined, // Save proof
                 alertLevel: isTaking ? 0 : med.alertLevel,
                 totalQuantity: newQuantity
             };
         }
         return med;
      })
    );
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    setMedications(prev => 
      prev.map(med => med.id === id ? { ...med, ...updates } : med)
    );
  };

  const handleAddMedication = (newMed: Medication) => {
    setMedications(prev => [...prev, newMed]);
    alert(`เพิ่มยา "${newMed.name}" เรียบร้อยแล้วค่ะ`);
  };

  const handleAddAppointment = (newApt: Appointment) => {
      setAppointments(prev => [...prev, newApt]);
  };

  const simulateSpecificAlert = (stage: number) => {
    const now = new Date();
    let minutesOffset = 0;
    if (stage === 0) minutesOffset = 5;
    else if (stage === 1) minutesOffset = -16;
    else if (stage === 2) minutesOffset = -31;
    else if (stage === 3) minutesOffset = -61;

    const targetTime = new Date(now.getTime() + minutesOffset * 60000);
    const timeString = `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')}`;

    setMedications(prev => {
        if (prev.length === 0) return prev;
        const newMeds = [...prev];
        newMeds[0] = { ...newMeds[0], taken: false, time: timeString, alertLevel: 0 };
        return newMeds;
    });
    alert("จำลองสถานะเรียบร้อย");
  };

  const simulateLowStock = () => {
    const med = medications.length > 0 ? medications[0] : INITIAL_MEDICATIONS[0];
    setLowStockAlert({ ...med, totalQuantity: 3, reorderThreshold: 5 });
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <MedicationDashboard 
            user={MOCK_USER} 
            medications={medications} 
            vitals={vitals}
            onUpdateVitals={updateVitals}
            onToggleMed={toggleMedication} 
            isCheckedIn={isCheckedIn}
            onCheckIn={handleCheckIn}
          />
        );
      case 'calendar':
        return (
            <CalendarView 
                appointments={appointments} 
                onAddAppointment={handleAddAppointment}
            />
        );
      case 'chat':
        return <ChatInterface history={chatHistory} setHistory={setChatHistory} />;
      case 'scan':
        return <ImageUploader />;
      case 'profile':
        return (
          <ProfileView 
            onAddMedication={handleAddMedication} 
            onSimulateStage={simulateSpecificAlert}
            onSimulateLowStock={simulateLowStock}
            onSimulateOversleep={simulateOversleep}
            onSaveVoice={setCustomVoiceUrl}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-50 flex flex-col overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[110] bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl animate-[fadeIn_0.3s_ease-out] flex items-center font-bold text-lg whitespace-nowrap">
              {toastMessage}
          </div>
      )}

      <SafetyNetSystem 
         medications={medications} 
         onUpdateMedication={updateMedication}
         onTakeMedication={toggleMedication}
         customVoiceUrl={customVoiceUrl}
      />

      {/* Low Stock Alert Modal */}
      {lowStockAlert && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center animate-[fadeIn_0.2s_ease-out]">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
                
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Package size={40} className="text-orange-600" />
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mb-2">ยาใกล้หมดแล้วค่ะ!</h3>
                <p className="text-slate-500 text-lg mb-4">
                    ยา <span className="text-pink-600 font-bold">"{lowStockAlert.commonName || lowStockAlert.name}"</span>
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex items-center justify-center space-x-2">
                    <span className="text-slate-500 font-medium">เหลือเพียง</span>
                    <span className="text-4xl font-bold text-red-500">{lowStockAlert.totalQuantity}</span>
                    <span className="text-slate-500 font-medium">เม็ด</span>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => setLowStockAlert(null)}
                        className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center"
                    >
                        <ShoppingBag className="mr-2" size={24}/>
                        รับทราบ / เตรียมเบิกยา
                    </button>
                    <button 
                         onClick={() => setLowStockAlert(null)}
                         className="text-slate-400 font-bold py-2 hover:bg-slate-50 rounded-xl"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Morning Check-in Emergency Modal */}
      {checkInAlertLevel === 'warning' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center">
                <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlarmClock size={48} className="text-red-600 animate-pulse" />
                </div>
                
                <h2 className="text-3xl font-black text-red-600 mb-2">ตื่นสายผิดปกติ!</h2>
                <p className="text-xl text-slate-700 font-bold mb-4">คุณยายสบายดีไหมคะ? <br/>ไม่มีการเคลื่อนไหวนานแล้ว</p>
                
                {autoCallCountdown !== null && (
                    <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 mb-6">
                        <p className="text-red-800 font-bold flex items-center justify-center mb-2">
                             <PhoneOutgoing className="mr-2"/> จะโทรหาหลานอัตโนมัติใน
                        </p>
                        <div className="text-6xl font-black text-red-600 font-mono">
                            {autoCallCountdown}
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleCheckIn}
                    className="w-full bg-green-500 text-white p-5 rounded-2xl font-bold text-2xl shadow-xl active:scale-95 transition-all mb-3"
                >
                    😊 ปลอดภัยดี (กดตรงนี้)
                </button>
                
                <button 
                    onClick={cancelCheckInAlert}
                    className="text-slate-400 font-bold py-2 underline"
                >
                    ขอโทษทีค่ะ ลืมกด (ยกเลิก)
                </button>
             </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-hidden relative">
        {renderView()}
      </div>
      
      {/* Navigation Bar */}
      <Navigation currentView={currentView} setView={setView} />
    </div>
  );
};

export default App;