import React, { useState } from "react";
import { 
  Play, 
  Square, 
  Check, 
  LogOut, 
  Settings, 
  Mic, 
  LayoutDashboard, 
  BookOpen, 
  ChevronRight,
  Volume2,
  Send,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

export function AffordanceFirst() {
  // We're showing the "after recording" state
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-teal-400 tracking-tight">صوتي</h1>
            <p className="text-slate-400 text-sm mt-1">منصة جمع البيانات الصوتية</p>
          </div>
          
          <nav className="px-3 py-2 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-3 bg-teal-500/10 text-teal-400 rounded-lg font-medium border border-teal-500/20">
              <Mic size={20} />
              <span>جلسة التسجيل</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-slate-50 hover:bg-slate-800/50 rounded-lg transition-colors">
              <LayoutDashboard size={20} />
              <span>لوحة التحكم</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-slate-50 hover:bg-slate-800/50 rounded-lg transition-colors">
              <BookOpen size={20} />
              <span>التعليمات</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-slate-50 hover:bg-slate-800/50 rounded-lg transition-colors">
              <Settings size={20} />
              <span>الإعدادات</span>
            </a>
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold border border-teal-500/30">
              أ.م
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">أحمد محمد</p>
              <p className="text-xs text-slate-400 truncate">ahmed@example.com</p>
            </div>
            <button className="text-slate-400 hover:text-red-400 transition-colors p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white">
              <ChevronRight size={24} />
            </button>
            <h2 className="text-lg font-medium">مجموعة الجمل العامة - الجزء الثالث</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-4" dir="ltr">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-teal-500' : i === 4 ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
              <span className="font-bold text-teal-400 text-base">5</span>
              <span>من</span>
              <span>20</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-0 overflow-y-auto">
          {/* Ambient background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-900/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="w-full max-w-3xl flex flex-col items-center gap-10 relative z-10">
            
            {/* Sentence Card */}
            <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 sm:p-12 shadow-[0_0_30px_rgba(20,184,166,0.1)] relative">
              <p className="text-3xl sm:text-4xl leading-relaxed text-center font-medium text-slate-100 py-4">
                "تعتبر الطاقة المتجددة من أهم ركائز التنمية المستدامة في العصر الحديث، حيث تساهم في حماية البيئة وتقليل الانبعاثات الكربونية."
              </p>
            </div>

            {/* Interaction Area with Explicit Affordance */}
            <div className="w-full max-w-2xl flex flex-col items-center gap-8">
              
              {/* Numbered Steps Sequence */}
              <div className="w-full flex justify-between items-center relative px-2 sm:px-8">
                {/* Connecting Line */}
                <div className="absolute top-5 left-16 right-16 h-[2px] bg-slate-800 -z-10" />
                
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-lg border-2 border-slate-700 relative bg-slate-950">
                    ١
                  </div>
                  <span className="text-sm text-slate-400 font-medium">استمع</span>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-lg border-2 border-slate-700 relative bg-slate-950">
                    ٢
                  </div>
                  <span className="text-sm text-slate-400 font-medium">سجّل</span>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border-2 border-teal-500 relative bg-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    ٣
                  </div>
                  <span className="text-sm text-teal-400 font-medium">أرسل</span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between w-full px-4">
                
                {/* Listen Button (Step 1) */}
                <div className="flex-1 flex justify-center">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-2 px-6 py-4 rounded-full bg-slate-800 border-2 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-all group shadow-lg"
                  >
                    {isPlaying ? <Square size={20} className="text-teal-400" /> : <Volume2 size={20} className="text-teal-400" />}
                    <span className="font-bold text-base">{isPlaying ? "إيقاف الاستماع" : "اضغط للاستماع"}</span>
                  </button>
                </div>

                {/* Record Button (Step 2 - After Recording State) */}
                <div className="flex-1 flex justify-center relative">
                  <div className="flex flex-col items-center gap-3">
                    {/* Crisp ring animation indicating recorded state */}
                    <div className="relative">
                      <div className="absolute inset-[-6px] rounded-full border-[3px] border-teal-500/50" />
                      
                      <button className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-teal-400 hover:bg-slate-700 hover:border-slate-500 transition-all z-10 relative group shadow-xl">
                        <Check size={36} strokeWidth={3} className="group-hover:scale-110 transition-transform text-teal-400" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">إعادة التسجيل</span>
                  </div>
                </div>

                {/* Submit Button (Step 3 - Available State) */}
                <div className="flex-1 flex justify-center">
                  <button className="flex items-center gap-2 px-6 py-4 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.5)] hover:shadow-[0_0_30px_rgba(20,184,166,0.8)] transform hover:-translate-y-1">
                    <span className="text-base">تم التسجيل ✓ أرسل الآن</span>
                    <Send size={20} className="rotate-180" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="w-full mt-4 px-6 py-4 bg-teal-900/30 border-2 border-teal-500/40 rounded-2xl flex items-center gap-4 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                <div className="bg-teal-500/20 p-2 rounded-full">
                  <Check size={24} className="text-teal-400" />
                </div>
                <p className="text-base font-medium">تم التسجيل ✓ يمكنك الإرسال أو الإعادة</p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AffordanceFirst;
