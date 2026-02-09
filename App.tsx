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

  // Logic to simulate specific alert stages
  const simulateSpecificAlert = (stage: number) => {
    const now = new Date();
    let minutesOffset = 0;

    // SafetyNet logic relies on: CurrentTime - MedTime
    // Stage 0: Want diff = -5 (between -10 and 0). So MedTime = Now + 5 min.
    // Stage 1: Want diff = +16 (>= 15). So MedTime = Now - 16 min.
    // Stage 2: Want diff = +31 (>= 30). So MedTime = Now - 31 min.
    // Stage 3: Want diff = +61 (>= 60). So MedTime = Now - 61 min.

    if (stage === 0) minutesOffset = 5;
    else if (stage === 1) minutesOffset = -16;
    else if (stage === 2) minutesOffset = -31;
    else if (stage === 3) minutesOffset = -61;

    const targetTime = new Date(now.getTime() + minutesOffset * 60000);
    const timeString = `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')}`;

    setMedications(prev => {
        if (prev.length === 0) return prev;
        const newMeds = [...prev];
        // Use the first medication for simulation
        newMeds[0] = {
            ...newMeds[0],
            taken: false, // Ensure it's not taken
            time: timeString,
            alertLevel: 0 // Reset level so logic picks it up as fresh
        };
        return newMeds;
    });

    // Provide feedback
    const stageNames = ["เตรียมตัว (-10 นาที)", "เลย 15 นาที", "เลย 30 นาที", "ฉุกเฉิน (1 ชม.)"];
    alert(`จำลองสถานะ: ${stageNames[stage]} เรียบร้อยแล้ว \n(ระบบจะแจ้งเตือนในไม่กี่วินาที)`);
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
            onSimulateStage={simulateSpecificAlert}
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