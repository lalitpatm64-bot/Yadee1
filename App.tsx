import React, { useState } from 'react';
import Navigation from './components/Navigation';
import MedicationDashboard from './components/MedicationDashboard';
import ChatInterface from './components/ChatInterface';
import ImageUploader from './components/ImageUploader';
import ProfileView from './components/ProfileView';
import SafetyNetSystem from './components/SafetyNetSystem';
import { ViewState, ChatMessage, Medication } from './types';
import { INITIAL_MEDICATIONS, MOCK_USER } from './constants';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('home');
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

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

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <MedicationDashboard 
            user={MOCK_USER} 
            medications={medications} 
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
          <ProfileView onAddMedication={handleAddMedication} />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col">
      {/* Global Safety Net System (Overlays) */}
      <SafetyNetSystem 
         medications={medications} 
         onUpdateMedication={updateMedication}
         onTakeMedication={toggleMedication}
      />

      <div className="flex-1 overflow-hidden relative">
        {renderView()}
      </div>
      <Navigation currentView={currentView} setView={setView} />
    </div>
  );
};

export default App;