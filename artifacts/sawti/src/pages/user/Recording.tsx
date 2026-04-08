import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetUserSessionSentences, useSubmitRecording, getGetUserSessionSentencesQueryKey, getGetUserSessionsQueryKey, useGetUserSessions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, Square, Check, Send, Volume2, RefreshCw, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserRecording() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sid = parseInt(sessionId || "0");
  const { data: sentences, isLoading } = useGetUserSessionSentences(sid, { query: { enabled: sid > 0, queryKey: getGetUserSessionSentencesQueryKey(sid) } });
  const { data: allSessions } = useGetUserSessions();
  const submitRecording = useSubmitRecording();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (sentences && currentIndex === 0) {
      const firstUnrecorded = sentences.findIndex(s => !s.recordingId);
      if (firstUnrecorded !== -1) setCurrentIndex(firstUnrecorded);
    }
  }, [sentences]);

  useEffect(() => {
    setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setIsSpeaking(false);
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [currentIndex]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "تعذر الوصول للميكروفون", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playTTS = (text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: "متصفحك لا يدعم تشغيل الصوت", variant: "destructive" });
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({ title: "تعذر تشغيل الصوت", variant: "destructive" });
      };
      window.speechSynthesis.speak(utterance);
    };
    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
        doSpeak();
      }
    }, 100);
  };

  const playRecording = () => {
    if (!audioBlob) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const submit = () => {
    if (!audioBlob || !currentSentence) return;
    const audioFile = new File([audioBlob], "recording.webm", { type: audioBlob.type });
    submitRecording.mutate({ data: { sentenceId: currentSentence.id, sessionId: sid, audio: audioFile } }, {
      onSuccess: () => {
        toast({ title: "تم الإرسال بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetUserSessionSentencesQueryKey(sid) });
        queryClient.invalidateQueries({ queryKey: getGetUserSessionsQueryKey() });
        const nextUnrecorded = sentences?.findIndex((s, i) => i > currentIndex && !s.recordingId);
        if (nextUnrecorded !== undefined && nextUnrecorded !== -1) {
          setCurrentIndex(nextUnrecorded);
        } else if (sentences && currentIndex < sentences.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setSessionDone(true);
        }
      }
    });
  };

  if (isLoading || !sentences) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-lg">جاري التحميل...</p>
      </div>
    );
  }
  if (sentences.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400 text-lg">لا توجد جمل في هذه الجلسة</p>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const recordedCount = sentences.filter(s => !!s.recordingId).length;
  const total = sentences.length;

  const nextSession = allSessions?.find(s => s.id !== sid && s.recordedCount < s.totalSentences);

  const isInIframe = window !== window.top;
  const fullPageUrl = `${window.location.origin}${window.location.pathname}`;

  const hasRecording = !!audioBlob && !isRecording;
  const activeStep = isRecording ? 2 : hasRecording ? 3 : isSpeaking ? 1 : 2;

  const getStepStyle = (step: number) =>
    activeStep === step
      ? "bg-slate-950 text-teal-400 border-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
      : step < activeStep
      ? "bg-teal-500/20 text-teal-300 border-2 border-teal-500/40"
      : "bg-slate-950 text-slate-400 border-2 border-slate-700";

  const getStepLabelStyle = (step: number) =>
    activeStep === step ? "text-teal-400 font-semibold" : step < activeStep ? "text-teal-500/70" : "text-slate-400";

  if (sessionDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8" dir="rtl">
        <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-12 max-w-2xl w-full text-center shadow-[0_0_40px_rgba(20,184,166,0.1)] space-y-6">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-50">أحسنت! انتهيت من هذه الجلسة</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            لقد أكملت جميع جمل هذه الجلسة. يمكنك الاستراحة الآن أو الانتقال إلى الجلسة التالية.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              className="flex items-center gap-2 justify-center px-6 py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors font-medium"
              onClick={() => setLocation("/user")}
            >
              <ArrowRight className="h-4 w-4" /> العودة للرئيسية
            </button>
            {nextSession && (
              <button
                className="flex items-center gap-2 justify-center px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors shadow-[0_0_20px_rgba(20,184,166,0.4)]"
                onClick={() => setLocation(`/user/session/${nextSession.id}`)}
              >
                الانتقال للجلسة التالية
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" dir="rtl">
      {/* Iframe Warning Banner */}
      {isInIframe && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              <strong>ملاحظة:</strong> لا يمكن تشغيل الصوت أو استخدام الميكروفون داخل نافذة المعاينة.
            </p>
          </div>
          <a
            href={fullPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold px-4 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            فتح في نافذة جديدة ↗
          </a>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
            onClick={() => setLocation("/user")}
          >
            <ArrowRight size={20} />
          </button>
          <h2 className="text-lg font-medium text-slate-100 truncate">جلسة التسجيل</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5" dir="ltr">
            {[...Array(Math.min(total, 20))].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < recordedCount
                    ? "bg-teal-500"
                    : i === currentIndex
                    ? "bg-teal-400 animate-pulse"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span className="font-bold text-teal-400 text-base">{currentIndex + 1}</span>
            <span>من</span>
            <span>{total}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-900/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-3xl flex flex-col items-center gap-10 relative z-10">

          {/* Previous recording status */}
          {currentSentence.recordingStatus && (
            <div className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border ${
              currentSentence.recordingStatus === "accepted"
                ? "bg-teal-900/30 border-teal-500/30 text-teal-300"
                : currentSentence.recordingStatus === "rejected"
                ? "bg-red-900/30 border-red-500/30 text-red-300"
                : "bg-slate-800/50 border-slate-700 text-slate-300"
            }`}>
              <span>
                {currentSentence.recordingStatus === "accepted" && "✓ التسجيل السابق مقبول — يمكنك إعادة التسجيل"}
                {currentSentence.recordingStatus === "rejected" && "✗ التسجيل السابق مرفوض — يرجى إعادة التسجيل"}
                {currentSentence.recordingStatus === "pending" && "⏳ التسجيل السابق بانتظار المراجعة"}
              </span>
            </div>
          )}

          {/* Sentence Card */}
          <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 sm:p-12 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
            <p className="text-3xl sm:text-4xl leading-relaxed text-center font-medium text-slate-100 py-4">
              "{currentSentence.text}"
            </p>
          </div>

          {/* Interaction Area */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">

            {/* Numbered Steps */}
            <div className="w-full flex justify-between items-center relative px-2 sm:px-8">
              <div className="absolute top-5 left-16 right-16 h-[2px] bg-slate-800 -z-10" />

              {[
                { num: "١", label: "استمع", step: 1 },
                { num: "٢", label: "سجّل", step: 2 },
                { num: "٣", label: "أرسل", step: 3 },
              ].map(({ num, label, step }) => (
                <div key={step} className="flex flex-col items-center gap-3 bg-slate-950">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getStepStyle(step)}`}>
                    {step < activeStep ? <Check size={18} strokeWidth={3} /> : num}
                  </div>
                  <span className={`text-sm ${getStepLabelStyle(step)}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between w-full px-4">

              {/* Listen Button (Step 1) */}
              <div className="flex-1 flex justify-center">
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    } else {
                      playTTS(currentSentence.text);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-4 rounded-full border-2 font-bold text-base transition-all shadow-lg ${
                    isSpeaking
                      ? "bg-teal-500/20 border-teal-500 text-teal-300"
                      : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
                  }`}
                >
                  <Volume2 size={20} className={isSpeaking ? "text-teal-400" : "text-teal-400"} />
                  <span>{isSpeaking ? "إيقاف" : "اضغط للاستماع"}</span>
                </button>
              </div>

              {/* Record Button (Step 2) */}
              <div className="flex-1 flex justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {(isRecording || hasRecording) && (
                      <div className={`absolute inset-[-6px] rounded-full border-[3px] ${
                        isRecording ? "border-red-500/70 animate-pulse" : "border-teal-500/50"
                      }`} />
                    )}
                    <button
                      onClick={isRecording ? stopRecording : hasRecording ? () => { setAudioBlob(null); setIsPlaying(false); } : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center font-bold transition-all z-10 relative shadow-xl border-2 ${
                        isRecording
                          ? "bg-red-600/80 border-red-500 text-white animate-pulse"
                          : hasRecording
                          ? "bg-slate-800 border-slate-600 text-teal-400 hover:bg-slate-700 hover:border-slate-500"
                          : "bg-teal-500 border-teal-400 text-slate-950 hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.4)]"
                      }`}
                    >
                      {isRecording
                        ? <Square size={32} className="fill-current" />
                        : hasRecording
                        ? <Check size={36} strokeWidth={3} />
                        : <Mic size={32} />
                      }
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                    {isRecording ? "إيقاف التسجيل" : hasRecording ? "إعادة التسجيل" : "اضغط للتسجيل"}
                  </span>
                </div>
              </div>

              {/* Submit Button (Step 3) */}
              <div className="flex-1 flex justify-center">
                {hasRecording ? (
                  <button
                    onClick={submit}
                    disabled={submitRecording.isPending}
                    className="flex items-center gap-2 px-5 py-4 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.5)] hover:shadow-[0_0_30px_rgba(20,184,166,0.8)] transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="text-base whitespace-nowrap">
                      {submitRecording.isPending ? "جاري الإرسال..." : "تم التسجيل ✓ أرسل"}
                    </span>
                    <Send size={18} className="rotate-180 flex-shrink-0" />
                  </button>
                ) : (
                  <button
                    disabled
                    title="أكمل التسجيل أولاً"
                    className="flex items-center gap-2 px-5 py-4 rounded-full border-2 border-dashed border-slate-700 text-slate-600 cursor-not-allowed font-medium"
                  >
                    <Send size={18} className="rotate-180" />
                    <span className="text-base">أرسل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Playback row (only when has recording) */}
            {hasRecording && (
              <button
                onClick={playRecording}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isPlaying
                  ? <><Square size={14} className="fill-current" /> إيقاف استماع للتسجيل</>
                  : <><Volume2 size={14} /> استمع للتسجيل</>
                }
              </button>
            )}

            {/* Status Banner */}
            <div className={`w-full px-6 py-4 rounded-2xl flex items-center gap-4 border-2 shadow-sm transition-all ${
              isRecording
                ? "bg-red-900/20 border-red-500/30 text-red-300"
                : hasRecording
                ? "bg-teal-900/30 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                : isSpeaking
                ? "bg-teal-900/20 border-teal-500/20 text-teal-400"
                : "bg-slate-800/50 border-slate-700 text-slate-400"
            }`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${
                isRecording ? "bg-red-500/20" : hasRecording ? "bg-teal-500/20" : "bg-slate-700"
              }`}>
                {isRecording
                  ? <Square size={20} className="text-red-400 fill-current" />
                  : hasRecording
                  ? <Check size={20} className="text-teal-400" />
                  : isSpeaking
                  ? <Volume2 size={20} className="text-teal-400" />
                  : <Mic size={20} className="text-slate-400" />
                }
              </div>
              <p className="text-base font-medium">
                {isRecording
                  ? "جاري التسجيل... اضغط إيقاف عند الانتهاء"
                  : hasRecording
                  ? "تم التسجيل ✓ يمكنك الإرسال أو الإعادة"
                  : isSpeaking
                  ? "جاري تشغيل الجملة... استمع جيداً"
                  : "الخطوة ١: اضغط استمع، ثم الخطوة ٢: سجّل صوتك"
                }
              </p>
            </div>

          </div>

          {/* Previous / Next navigation */}
          <div className="flex justify-between w-full">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ArrowRight size={16} /> السابق
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
              disabled={currentIndex === total - 1}
            >
              التالي <ArrowRight size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
