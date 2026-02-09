import React, { useState } from 'react';
import Navigation from './components/Navigation';
import MedicationDashboard from './components/MedicationDashboard';
import ChatInterface from './components/ChatInterface';
import ImageUploader from './components/ImageUploader';
import ProfileView from './components/ProfileView';
import SafetyNetSystem from './components/SafetyNetSystem';
import { ViewState, ChatMessage, Medication, VitalSigns } from './types';
import { INITIAL_MEDICATIONS, MOCK_USER } from './constants';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('home');
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [customVoiceUrl, setCustomVoiceUrl] = useState<string | null>(null);
  
  // New State for Vitals
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: 128,
    diastolic: 80,
    sugar: 105,
    lastUpdated: new Date()
  });

  const updateVitals = (newVitals: Partial<VitalSigns>) => {
    setVitals(prev => ({
        ...prev,
        ...newVitals,
        lastUpdated: new Date()
    }));
  };

  const toggleMedication = (id: string) => {
    setMedications(prev => 
      prev.map(med => {
         // When taken, reset alert level to 0
         if (med.id === id) {
             const isTaking = !med.taken;
             return { ...med, taken: isTaking, alertLevel: isTaking ? 0 : med.alertLevel };
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

  // Logic to simulate a missed dose for demonstration/testing
  const simulateMissedDose = () => {
    const now = new Date();
    // Set time to 16 minutes ago to trigger Stage 1 (15 min) alert immediately
    const pastTime = new Date(now.getTime() - 16 * 60000); 
    const timeString = `${pastTime.getHours().toString().padStart(2, '0')}:${pastTime.getMinutes().toString().padStart(2, '0')}`;

    setMedications(prev => {
        if (prev.length === 0) return prev;
        // Modify the first medication to be untaken and past due
        const newMeds = [...prev];
        newMeds[0] = {
            ...newMeds[0],
            taken: false,
            time: timeString,
            alertLevel: 0 // Reset level so SafetyNet picks it up as new Stage 1
        };
        return newMeds;
    });
    alert("ระบบกำลังจำลองสถานการณ์: ลืมทานยาเมื่อ 16 นาทีที่แล้ว... (รอสักครู่ระบบจะแจ้งเตือน)");
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
          />
        );
      case 'chat':
        return (
          <ChatInterface 
            history={chatHistory} 
            setHistory={setChatHistory} 
          />
        );
      case 'scan':
        return <ImageUploader />;
      case 'profile':
        return (
          <ProfileView 
            onAddMedication={handleAddMedication} 
            onSimulateAlert={simulateMissedDose}
            onSaveVoice={setCustomVoiceUrl}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    // Use fixed inset-0 and h-[100dvh] for robust mobile layout
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-50 flex flex-col overflow-hidden">
      {/* Global Safety Net System (Overlays) */}
      <SafetyNetSystem 
         medications={medications} 
         onUpdateMedication={updateMedication}
         onTakeMedication={toggleMedication}
         customVoiceUrl={customVoiceUrl}
      />

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