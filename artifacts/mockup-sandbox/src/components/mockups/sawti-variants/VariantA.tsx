import React, { useState } from "react";
import { 
  Mic, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  LayoutDashboard, 
  MessageSquarePlus, 
  LogOut, 
  User,
  CheckCircle2,
  Play
} from "lucide-react";

export function VariantA() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div dir="rtl" className="flex h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar - Navy (#0f172a) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-xl z-10">
        <div>
          {/* Logo area */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-3 text-teal-400">
              <div className="w-8 h-8 rounded bg-teal-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">صوتي</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 mt-4">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">لوحة التحكم</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              <MessageSquarePlus className="w-5 h-5" />
              <span className="font-medium">اقتراح جمل</span>
            </a>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">أحمد محمد</p>
              <p className="text-xs text-slate-400 truncate">متطوع</p>
            </div>
          </div>
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">جلسة تسجيل أساسية</h1>
          <div className="mr-auto flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-200">
              قيد التقدم
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col">
          
          {/* Progress Section */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">التقدم في الجلسة</p>
                <p className="text-lg font-bold text-slate-800">3 من 10 جمل</p>
              </div>
              <span className="text-2xl font-bold text-teal-600">30%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full transition-all duration-500 ease-out" style={{ width: '30%' }}></div>
            </div>
          </div>

          {/* Sentence Card */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col justify-center items-center text-center min-h-[300px] relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50 pointer-events-none"></div>
            
            <p className="text-slate-400 text-sm font-medium tracking-wider mb-6 uppercase z-10">الجملة الحالية</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight z-10" style={{ lineHeight: '1.6' }}>
              الشمس تشرق من الشرق وتغرب في الغرب كل يوم
            </h2>
          </div>

          {/* Controls Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 z-10">
            <div className="flex items-center justify-between">
              
              {/* Prev Button */}
              <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                <ChevronRight className="w-5 h-5" />
                <span>السابق</span>
              </button>

              {/* Main Actions */}
              <div className="flex items-center gap-6">
                
                {/* Listen Button */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-bold transition-all ${
                    isPlaying 
                      ? 'border-teal-600 text-teal-600 bg-teal-50' 
                      : 'border-slate-200 text-slate-600 hover:border-teal-600 hover:text-teal-600'
                  }`}
                >
                  <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span>استمع</span>
                </button>

                {/* Record Button */}
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 scale-105' 
                      : 'bg-teal-600 hover:bg-teal-700 hover:-translate-y-1'
                  }`}
                >
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full border-4 border-red-500 opacity-50 animate-ping"></span>
                  )}
                  <Mic className="w-8 h-8 text-white" />
                </button>

                {/* Submit / Status */}
                <div className="w-[120px] flex justify-center">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    في انتظار التسجيل
                  </span>
                </div>

              </div>

              {/* Next Button */}
              <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
                <span>التالي</span>
                <ChevronLeft className="w-5 h-5" />
              </button>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
