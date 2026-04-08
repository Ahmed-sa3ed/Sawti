import React, { useState } from "react";
import { Mic, Square, Play, Check, ChevronRight, LayoutDashboard, Settings, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function HierarchyFirst() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSentences = 20;
  const currentSentence = 5;

  const handleRecordClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
    } else {
      setIsRecording(true);
      setHasRecorded(false);
      setIsPlaying(false);
    }
  };

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Sidebar - Visually receded */}
      <aside className="w-72 bg-slate-900/50 border-l border-slate-800/50 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-400">صوتي</h2>
          </div>
          <nav className="px-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/40 text-slate-300 font-medium transition-colors">
              <Mic className="w-5 h-5 opacity-70" />
              جلسة التسجيل
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              لوحة التحكم
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
              <HelpCircle className="w-5 h-5" />
              التعليمات
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
              <Settings className="w-5 h-5" />
              الإعدادات
            </a>
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
              أ.م
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-400 truncate">أحمد محمد</p>
              <p className="text-xs text-slate-600 truncate">ahmed@example.com</p>
            </div>
            <button className="text-slate-600 hover:text-slate-400 p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Session title only, no counter here */}
        <header className="h-20 px-10 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-slate-300">مجموعة الجمل العامة - الجزء الأول</h1>
          </div>
          <div>
             {/* Empty space to balance header */}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col px-10 pb-12 max-w-5xl mx-auto w-full">
          
          {/* Progress Section - Positioned prominently above sentence */}
          <div className="w-full mb-12 mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium text-teal-400">الجملة {currentSentence} من {totalSentences}</span>
            </div>
            {/* Thick segmented progress bar */}
            <div className="flex gap-1.5 w-full">
              {Array.from({ length: totalSentences }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-3 flex-1 rounded-sm",
                    i < currentSentence 
                      ? "bg-teal-500" 
                      : "bg-slate-800"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Sentence - MAXIMUM DOMINANCE */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-7xl font-bold text-white text-center leading-[1.4] tracking-tight">
              تعتبر اللغة العربية من أقدم اللغات الحية في العالم.
            </p>
          </div>

          {/* Controls - Explicit visual weight hierarchy */}
          <div className="mt-12 flex flex-col items-center gap-6 shrink-0">
            <div className="flex items-center justify-center gap-10">
              
              {/* Secondary: Listen */}
              <button 
                onClick={handlePlayClick}
                disabled={isRecording}
                className={cn(
                  "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all",
                  isRecording 
                    ? "border-slate-800 text-slate-700 cursor-not-allowed" 
                    : "border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white"
                )}
              >
                {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
              </button>

              {/* Primary: Record - Largest, most prominent */}
              <button 
                onClick={handleRecordClick}
                className={cn(
                  "w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                  isRecording 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                    : "bg-teal-500 hover:bg-teal-400 shadow-teal-500/20"
                )}
              >
                {isRecording ? (
                  <Square className="w-10 h-10 text-white fill-current" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </button>

              {/* Tertiary: Submit - Shown only after recording */}
              <div className="w-16 h-16 flex items-center justify-center">
                {hasRecorded && !isRecording && (
                  <button className="w-14 h-14 rounded-full bg-slate-800 text-teal-400 hover:bg-slate-700 hover:text-teal-300 flex items-center justify-center transition-all">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </button>
                )}
              </div>

            </div>

            {/* Status text */}
            <p className={cn(
              "text-lg font-medium",
              isRecording ? "text-rose-400" : hasRecorded ? "text-teal-400" : "text-slate-500"
            )}>
              {isRecording 
                ? "جاري التسجيل... اضغط للإيقاف" 
                : hasRecorded 
                  ? "تم التسجيل. يمكنك الاستماع أو الإرسال." 
                  : "جاهز للتسجيل. اضغط على الميكروفون للبدء."}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
