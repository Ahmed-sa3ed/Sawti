import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useGetUserSessionSentences, useSubmitRecording, getGetUserSessionSentencesQueryKey, getGetUserSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, RefreshCw, Send, Volume2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UserRecording() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const sid = parseInt(sessionId || "0");
  const { data: sentences, isLoading } = useGetUserSessionSentences(sid, { query: { enabled: sid > 0 } });
  const submitRecording = useSubmitRecording();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Find first unrecorded sentence on load
  useEffect(() => {
    if (sentences && currentIndex === 0) {
      const firstUnrecorded = sentences.findIndex(s => !s.recordingId);
      if (firstUnrecorded !== -1) {
        setCurrentIndex(firstUnrecorded);
      }
    }
  }, [sentences]);

  // Reset recording state when sentence changes
  useEffect(() => {
    setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [currentIndex]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  };

  const playRecording = () => {
    if (audioBlob) {
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
    }
  };

  const submit = () => {
    if (!audioBlob || !currentSentence) return;
    
    const formData = new FormData();
    formData.append("sentenceId", currentSentence.id.toString());
    formData.append("sessionId", sid.toString());
    formData.append("audio", audioBlob, "recording.webm");
    
    submitRecording.mutate({ data: formData as any }, {
      onSuccess: () => {
        toast({ title: "تم الإرسال بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetUserSessionSentencesQueryKey(sid) });
        queryClient.invalidateQueries({ queryKey: getGetUserSessionsQueryKey() });
        
        // Move to next unrecorded or next index
        const nextUnrecorded = sentences?.findIndex((s, i) => i > currentIndex && !s.recordingId);
        if (nextUnrecorded && nextUnrecorded !== -1) {
          setCurrentIndex(nextUnrecorded);
        } else if (sentences && currentIndex < sentences.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished session
          setLocation("/user");
        }
      }
    });
  };

  if (isLoading || !sentences) return <div>جاري التحميل...</div>;
  if (sentences.length === 0) return <div>لا توجد جمل في هذه الجلسة</div>;

  const currentSentence = sentences[currentIndex];
  const recordedCount = sentences.filter(s => !!s.recordingId).length;
  const progress = (recordedCount / sentences.length) * 100;

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">تسجيل الجلسة</h1>
          <p className="text-sm text-muted-foreground mt-1">جملة {currentIndex + 1} من {sentences.length}</p>
        </div>
        <Button variant="ghost" onClick={() => setLocation("/user")} className="gap-2">
          العودة <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={progress} className="mb-8" />

      <div className="flex-1 flex flex-col justify-center mb-12">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="text-center py-12">
            <h2 className="text-4xl md:text-5xl font-bold leading-relaxed text-foreground">
              {currentSentence.text}
            </h2>
            
            {currentSentence.recordingStatus && (
              <div className="mt-8">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  currentSentence.recordingStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                  currentSentence.recordingStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  حالة التسجيل السابق: {
                    currentSentence.recordingStatus === 'accepted' ? 'مقبول' :
                    currentSentence.recordingStatus === 'rejected' ? 'مرفوض' : 'بانتظار المراجعة'
                  }
                </span>
                <p className="text-sm text-muted-foreground mt-4">يمكنك إعادة التسجيل إذا أردت استبداله.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex justify-center items-center gap-4 mb-6">
          <Button variant="outline" size="lg" className="rounded-full h-14 px-6 gap-2" onClick={() => playTTS(currentSentence.text)}>
            <Volume2 className="h-5 w-5" /> استمع
          </Button>

          {!isRecording && !audioBlob && (
            <Button size="lg" className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600" onClick={startRecording}>
              <Mic className="h-6 w-6 text-white" />
            </Button>
          )}

          {isRecording && (
            <Button size="lg" className="rounded-full h-16 w-16 bg-red-600 hover:bg-red-700 animate-pulse" onClick={stopRecording}>
              <Square className="h-6 w-6 text-white fill-current" />
            </Button>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button variant="outline" size="lg" className="rounded-full h-14 w-14" onClick={playRecording}>
                {isPlaying ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </Button>
              <Button variant="outline" size="lg" className="rounded-full h-14 w-14 text-orange-500 hover:text-orange-600" onClick={() => setAudioBlob(null)}>
                <RefreshCw className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {audioBlob && (
          <div className="flex justify-center mt-6">
            <Button size="lg" className="w-full md:w-auto px-12 gap-2 text-lg h-14" onClick={submit} disabled={submitRecording.isPending}>
              {submitRecording.isPending ? "جاري الإرسال..." : "إرسال التسجيل"} <Send className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
          السابق
        </Button>
        <Button variant="outline" onClick={() => setCurrentIndex(Math.min(sentences.length - 1, currentIndex + 1))} disabled={currentIndex === sentences.length - 1}>
          التالي
        </Button>
      </div>
    </div>
  );
}
