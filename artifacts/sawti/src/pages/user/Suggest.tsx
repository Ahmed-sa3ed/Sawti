import { useCreateSuggestion } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const suggestionSchema = z.object({
  text: z.string().min(5, "النص يجب أن يكون 5 أحرف على الأقل"),
});

export default function UserSuggest() {
  const createSuggestion = useCreateSuggestion();
  const [result, setResult] = useState<{ isDuplicate?: boolean, success?: boolean } | null>(null);

  const form = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = (values: z.infer<typeof suggestionSchema>) => {
    setResult(null);
    createSuggestion.mutate({ data: values }, {
      onSuccess: (data) => {
        setResult({ isDuplicate: data.isDuplicate, success: true });
        if (!data.isDuplicate) {
          form.reset();
        }
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">اقتراح جمل جديدة</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>لديك جملة مفيدة؟</CardTitle>
          <CardDescription>
            ساعد في إثراء قاعدة البيانات باقتراح جمل عربية سليمة وقابلة للقراءة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نص الجملة</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="h-32 text-lg" 
                        placeholder="اكتب جملة عربية واضحة هنا..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {result?.success && !result.isDuplicate && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    تم إرسال اقتراحك بنجاح! شكراً لك.
                  </AlertDescription>
                </Alert>
              )}
              
              {result?.isDuplicate && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-medium">
                    عذراً، هذه الجملة موجودة مسبقاً في قاعدة البيانات.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full text-lg h-12" disabled={createSuggestion.isPending}>
                {createSuggestion.isPending ? "جاري الإرسال..." : "إرسال الاقتراح"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
