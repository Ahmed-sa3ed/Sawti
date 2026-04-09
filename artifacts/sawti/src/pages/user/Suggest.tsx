import { useCreateSuggestion } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertTriangle, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { useState } from "react";

const suggestionSchema = z.object({
  text: z.string().min(1, "النص مطلوب"),
});

type SubmitResult = {
  submitted: number;
  duplicates: number;
  errors: number;
};

export default function UserSuggest() {
  const createSuggestion = useCreateSuggestion();
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (values: z.infer<typeof suggestionSchema>) => {
    const lines = values.text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 3);

    if (lines.length === 0) {
      form.setError("text", { message: "يجب أن تحتوي على جملة واحدة على الأقل (3 أحرف فأكثر)" });
      return;
    }

    setResult(null);
    setIsSubmitting(true);

    let submitted = 0;
    let duplicates = 0;
    let errors = 0;

    for (const line of lines) {
      try {
        const data = await createSuggestion.mutateAsync({ data: { text: line } });
        if (data.isDuplicate) {
          duplicates++;
        } else {
          submitted++;
        }
      } catch {
        errors++;
      }
    }

    setIsSubmitting(false);
    setResult({ submitted, duplicates, errors });
    if (submitted > 0) form.reset();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 sm:p-12 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">اقتراح جمل جديدة</h1>
          <p className="text-slate-400 text-sm mt-1">ساعد في إثراء قاعدة البيانات باقتراح جمل عربية سليمة وقابلة للقراءة.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
              <MessageSquarePlus size={18} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-slate-100 font-medium">لديك جمل مفيدة؟</h2>
              <p className="text-slate-500 text-sm">أضف جملة أو أكثر، كل سطر يُعدّ جملة منفصلة</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium">نص الجمل</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={6}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-lg placeholder:text-slate-600 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-colors resize-none"
                        placeholder={"اكتب جملة عربية واضحة هنا...\nأو أضف أكثر من جملة، كل جملة في سطر"}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500 mt-1">كل سطر سيتم إرساله كجملة مستقلة</p>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {result && result.submitted > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-teal-900/30 border border-teal-500/30 rounded-xl text-teal-300">
                  <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    تم إرسال {result.submitted} جملة بنجاح!{" "}
                    {result.duplicates > 0 && `(${result.duplicates} مكررة)`}{" "}
                    {result.errors > 0 && `(${result.errors} فشل)`}
                  </span>
                </div>
              )}

              {result && result.submitted === 0 && result.duplicates > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300">
                  <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    جميع الجمل موجودة مسبقاً في قاعدة البيانات ({result.duplicates} جملة مكررة).
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال الاقتراحات"}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
