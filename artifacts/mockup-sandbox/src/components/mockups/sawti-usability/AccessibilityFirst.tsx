import React from "react";
import { Mic, Play, Send, LogOut, Home, Settings, Info, Menu } from "lucide-react";

export function AccessibilityFirst() {
  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/50">
            <Mic className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">صوتي</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-teal-500/10 text-teal-400 font-bold border border-teal-500/50 transition-all">
            <Mic className="w-6 h-6" />
            <span className="text-lg">جلسة التسجيل</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-semibold">
            <Home className="w-6 h-6" />
            <span className="text-lg">لوحة القيادة</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-semibold">
            <Info className="w-6 h-6" />
            <span className="text-lg">التعليمات</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-semibold">
            <Settings className="w-6 h-6" />
            <span className="text-lg">الإعدادات</span>
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xl">
              أ
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-base font-bold text-white truncate">أحمد محمد</p>
              <p className="text-sm font-semibold text-teal-300 truncate">مساهم نشط</p>
            </div>
            <button className="text-slate-300 hover:text-white transition-colors" aria-label="تسجيل الخروج">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/50">
              <Mic className="w-4 h-4 text-teal-400" />
            </div>
            <h1 className="text-xl font-bold text-white">صوتي</h1>
          </div>
          <button className="text-slate-300" aria-label="القائمة">
            <Menu className="w-7 h-7" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 w-full max-w-5xl mx-auto">
          
          {/* Header & Progress */}
          <div className="w-full mb-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">جلسة تسجيل #402</h2>
                <p className="text-slate-300 text-lg">يرجى قراءة الجملة التالية بوضوح وهدوء</p>
              </div>
              <div className="text-left font-bold text-xl text-white">
                5 / 20 جملة
              </div>
            </div>
            
            {/* Progress Bar (High Contrast) */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-teal-500 w-1/4" role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100}></div>
            </div>
          </div>

          {/* Sentence Card (Solid, High Contrast) */}
          <div className="w-full relative">
            <div className="w-full bg-slate-800 border-2 border-slate-600 rounded-3xl p-10 md:p-16 text-center shadow-lg">
              <p className="text-5xl md:text-6xl font-bold text-white" style={{ lineHeight: '2.0' }}>
                الشمس تشرق من الشرق وتغرب في الغرب كل يوم
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-16 w-full max-w-3xl flex flex-col items-center gap-8">
            <div className="flex items-center justify-center gap-6 w-full">
              
              {/* Listen Button */}
              <button className="flex flex-col items-center gap-3 text-slate-300 hover:text-white transition-colors group">
                <div className="w-16 h-16 rounded-full border-2 border-slate-500 group-hover:border-teal-400 flex items-center justify-center bg-slate-800 transition-all">
                  <Play className="w-8 h-8 fill-current" />
                </div>
                <span className="text-lg font-bold">استمع</span>
              </button>

              {/* Record Button */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-teal-500/20 rounded-full animate-pulse"></div>
                  <button className="relative w-24 h-24 rounded-full bg-teal-600 hover:bg-teal-500 flex items-center justify-center border-4 border-teal-300 transition-all duration-300 z-10">
                    <Mic className="w-12 h-12 text-white" />
                  </button>
                </div>
                <span className="text-xl font-bold text-teal-400">تسجيل</span>
              </div>

              {/* Submit Button (Disabled state - high contrast) */}
              <button disabled className="flex flex-col items-center gap-3 text-slate-400 cursor-not-allowed opacity-100">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-600 flex items-center justify-center bg-slate-900">
                  <Send className="w-7 h-7 text-slate-500" />
                </div>
                <span className="text-lg font-bold text-slate-500">غير متاح</span>
              </button>
              
            </div>
            
            <p className="text-slate-300 text-lg font-bold bg-slate-900 px-6 py-3 rounded-xl border border-slate-700">
              جاهز للتسجيل. اضغط على الميكروفون للبدء.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccessibilityFirst;
