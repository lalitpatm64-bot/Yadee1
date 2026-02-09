import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { Send, Phone, Mic, User, Bot } from 'lucide-react';
import { EMERGENCY_CONTACT } from '../constants';

interface Props {
  history: ChatMessage[];
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const SUGGESTED_QUESTIONS = [
    "💊 ลืมกินยา",
    "🤕 ปวดหัวมาก",
    "🤮 คลื่นไส้",
    "🕒 กินยาตอนไหน",
    "💓 ใจสั่น",
    "😴 นอนไม่หลับ"
];

const ChatInterface: React.FC<Props> = ({ history, setHistory }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  const checkForEmergency = (text: string) => {
    const keywords = ['แน่นหน้าอก', 'เจ็บหน้าอก', 'เวียนหัวมาก', 'จะเป็นลม', 'ล้ม', 'หายใจไม่ออก', 'ช่วยด้วย', 'ใจสั่น'];
    return keywords.some(keyword => text.includes(keyword));
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    const isEmergency = checkForEmergency(messageText);

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (isEmergency) {
        setTimeout(() => {
            const emergencyResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: `⚠️ **ฉุกเฉิน!** (Emergency Alert)\n\nอาการของคุณฟังดูไม่ค่อยดีเลยนะคะ **โปรดโทร 1669 เดี๋ยวนี้** หรือเรียกคนใกล้ตัวทันทีค่ะ!\n\n(กดปุ่มสีแดงด้านบนเพื่อโทรออกทันที)`,
                isEmergency: true,
                timestamp: new Date()
            };
            setHistory(prev => [...prev, emergencyResponse]);
            setLoading(false);
        }, 500);
        return;
    }

    try {
      const responseText = await sendChatMessage(history, userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "ขออภัยค่ะ ระบบมีปัญหาเล็กน้อย ลองใหม่อีกครั้งนะคะ",
          timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // pb-20 accounts for the bottom Navigation height (h-20)
    <div className="flex flex-col h-full bg-slate-50 relative pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
           <div className="bg-pink-100 p-2 rounded-full">
                <Bot size={24} className="text-pink-600" />
           </div>
           <div>
               <h2 className="text-xl font-bold text-pink-800">คุยกับหมอ AI</h2>
               <p className="text-slate-500 text-sm">ตอบไว • ใจดี • 24 ชม.</p>
           </div>
        </div>
        <a href={`tel:${EMERGENCY_CONTACT}`} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg animate-pulse">
            <Phone size={24} />
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {history.length === 0 && (
             <div className="text-center mt-10 text-slate-400 p-6 bg-slate-100 rounded-3xl mx-4">
                <p className="text-xl font-bold text-slate-600 mb-2">สวัสดีค่ะ 🙏</p>
                <p className="text-lg">มีอาการอะไรบอกหนูได้เลยนะคะ</p>
                <p className="text-base mt-2 opacity-75">เช่น "ลืมกินยา" หรือ "เวียนหัว"</p>
             </div>
        )}
        
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-3xl text-lg leading-relaxed shadow-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-pink-500 text-white rounded-br-none'
                  : msg.isEmergency 
                    ? 'bg-red-50 border-2 border-red-500 text-red-900 rounded-bl-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-3xl rounded-bl-none shadow-sm border border-slate-100 flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 z-20">
        {/* Suggested Chips */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 border-b border-slate-100">
            {SUGGESTED_QUESTIONS.map((text) => (
                <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="flex-shrink-0 bg-white text-pink-700 border border-pink-200 px-4 py-2 rounded-full text-base font-medium shadow-sm active:bg-pink-50"
                >
                    {text}
                </button>
            ))}
        </div>

        {/* Text Input */}
        <div className="p-4 flex items-center space-x-2">
           <button className="p-3 text-slate-400 bg-slate-100 rounded-full active:bg-slate-200">
              <Mic size={24} />
           </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="พิมพ์อาการ..."
            className="flex-1 p-4 bg-slate-100 rounded-full text-xl focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`p-4 rounded-full shadow-lg transition-colors ${
              !input.trim() || loading ? 'bg-slate-200 text-slate-400' : 'bg-pink-500 text-white active:scale-95'
            }`}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;