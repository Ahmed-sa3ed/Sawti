import React from "react";
import { Mic, Play, Square, Send, LogOut, Home, Settings, Info, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function VariantB() {
  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Mic className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">صوتي</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-teal-500/10 text-teal-400 font-medium border border-teal-500/20 transition-all">
            <Mic className="w-5 h-5" />
            جلسة التسجيل
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all font-medium">
            <Home className="w-5 h-5" />
            لوحة القيادة
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all font-medium">
            <Info className="w-5 h-5" />
            التعليمات
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all font-medium">
            <Settings className="w-5 h-5" />
            الإعدادات
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              أ
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">أحمد محمد</p>
              <p className="text-xs text-teal-400 truncate">مساهم نشط</p>
            </div>
            <button className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[100px] rounded-full"></div>
        </div>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
              <Mic className="w-4 h-4 text-teal-400" />
            </div>
            <h1 className="text-xl font-bold text-white">صوتي</h1>
          </div>
          <button className="text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 w-full max-w-5xl mx-auto">
          
          {/* Header & Progress */}
          <div className="w-full mb-10">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">جلسة تسجيل #402</h2>
                <p className="text-slate-400">يرجى قراءة الجملة التالية بوضوح وهدوء</p>
              </div>
              <div className="text-left">
                <span className="text-3xl font-light text-teal-400">5</span>
                <span className="text-slate-500 text-lg"> / 20</span>
              </div>
            </div>
            
            {/* Progress Dots */}
            <div className="flex gap-2 w-full mt-4">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    i < 4 ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 
                    i === 4 ? 'bg-teal-400 animate-pulse shadow-[0_0_12px_rgba(20,184,166,0.8)]' : 
                    'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Sentence Card (Glassmorphism) */}
          <div className="w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 md:p-16 text-center shadow-2xl">
              <p className="text-4xl md:text-6xl font-bold text-white leading-tight md:leading-normal" style={{ lineHeight: '1.6' }}>
                الشمس تشرق من الشرق وتغرب في الغرب كل يوم
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-16 w-full max-w-2xl flex flex-col items-center gap-8">
            
            <div className="flex items-center justify-center gap-8 w-full">
              {/* Listen Button */}
              <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group">
                <div className="w-14 h-14 rounded-full border border-slate-700 group-hover:border-teal-500/50 flex items-center justify-center bg-slate-800/50 group-hover:bg-teal-500/10 transition-all">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <span className="text-sm font-medium">استمع</span>
              </button>

              {/* Record Button */}
              <div className="relative">
                <div className="absolute -inset-4 bg-teal-500/20 rounded-full blur-xl animate-pulse"></div>
                <button className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.4)] hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] hover:scale-105 transition-all duration-300 group">
                  <Mic className="w-10 h-10 text-white" />
                  
                  {/* Glowing ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                </button>
              </div>

              {/* Submit Button (Disabled state initially) */}
              <button className="flex flex-col items-center gap-2 text-slate-600 cursor-not-allowed">
                <div className="w-14 h-14 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">إرسال</span>
              </button>
            </div>
            
            <p className="text-slate-500 text-sm font-medium">جاهز للتسجيل. اضغط على الميكروفون للبدء.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VariantB;
