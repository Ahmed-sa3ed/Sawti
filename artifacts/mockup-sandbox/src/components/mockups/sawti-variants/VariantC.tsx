import React, { useState } from "react";
import { Mic, Play, Check, Home, List, User, Settings, Sparkles, ChevronLeft, Lightbulb, Square } from "lucide-react";

export function VariantC() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div dir="rtl" className="flex h-[100dvh] w-full bg-[#faf7f2] font-sans overflow-hidden text-slate-800">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l-4 border-l-violet-600 shadow-lg flex flex-col z-10 rounded-l-3xl my-4 ml-4">
        {/* Logo */}
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md transform rotate-3">
            <Mic className="w-5 h-5 -rotate-3" />
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-l from-violet-600 to-indigo-600 tracking-tight">
            صوتي <Sparkles className="inline w-5 h-5 text-yellow-400 mb-4" />
          </h1>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<Home />} label="الرئيسية" />
          <NavItem icon={<List />} label="جلسات التسجيل" active />
          <NavItem icon={<User />} label="إحصائياتي" />
          <NavItem icon={<Settings />} label="الإعدادات" />
        </nav>

        {/* User Chip */}
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fff7ed] hover:bg-orange-100 transition-colors cursor-pointer border border-orange-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-inner">
              أ
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-800">أحمد محمد</p>
              <p className="text-xs text-orange-600/80 font-medium">مساهم نشط 🌟</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-orange-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-y-auto">
        {/* Top Header */}
        <header className="p-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              تسجيل الجمل <span className="text-2xl">🎙️</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">ساهم بصوتك في تطوير تقنيات التعرف على الكلام</p>
          </div>
          
          {/* Progress Ring */}
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-full shadow-sm border border-violet-100">
             <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">جملة 3 من 10</span>
                <span className="text-xs font-medium text-violet-600">30% مكتمل</span>
             </div>
             <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-violet-600 drop-shadow-sm transition-all duration-1000 ease-out"
                    strokeDasharray="30, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex items-center justify-center w-full h-full">
                  <span className="text-xs font-bold text-violet-700">3</span>
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
          
          {/* Sentence Card */}
          <div className="w-full bg-white rounded-[2rem] shadow-xl shadow-violet-900/5 border-l-8 border-l-violet-500 p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-100/50 to-indigo-100/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-100/50 to-pink-100/50 rounded-full blur-2xl -ml-5 -mb-5"></div>
            
            <p className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-normal text-center relative z-10 selection:bg-violet-200" style={{ lineHeight: '1.6' }}>
              "الشمس تشرق من الشرق وتغرب في الغرب كل يوم"
            </p>
          </div>

          {/* Controls */}
          <div className="mt-16 flex items-center justify-center gap-6 md:gap-8 w-full">
            <button className="flex items-center gap-2 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-800 px-8 py-4 font-bold text-lg transition-all active:scale-95 shadow-sm border border-violet-200/50">
              <Play className="w-6 h-6 fill-current" />
              استمع
            </button>

            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 bg-violet-400 rounded-full animate-ping opacity-20 scale-150"></div>
              )}
              <button 
                onClick={() => setIsRecording(!isRecording)}
                className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 z-10 relative
                  ${isRecording 
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 scale-105 shadow-red-500/30' 
                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:scale-105 shadow-violet-600/30'
                  } active:scale-95`}
              >
                {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-12 h-12" />}
              </button>
            </div>

            <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 px-8 py-4 font-bold text-lg transition-all shadow-md hover:shadow-lg active:scale-95">
              <Check className="w-6 h-6" strokeWidth={3} />
              التالي
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-[#fff7ed] text-orange-800 rounded-2xl p-5 mt-16 flex items-start gap-4 shadow-sm border border-orange-100/50 max-w-xl">
             <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                <Lightbulb className="w-6 h-6" />
             </div>
             <div>
                <h4 className="font-bold mb-1">نصيحة للتسجيل</h4>
                <p className="text-sm opacity-90 leading-relaxed">اقرأ الجملة بصوت واضح وطبيعي، في بيئة هادئة خالية من الضوضاء للحصول على أفضل جودة ممكنة.</p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm
      ${active 
        ? 'bg-violet-50 text-violet-700' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }
    `}>
      <div className={`${active ? 'text-violet-600' : 'text-slate-400'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      {label}
    </a>
  );
}
