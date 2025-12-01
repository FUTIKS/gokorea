import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  FileDown,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  message_type: "voice" | "text";
  created_at: string;
}

const MAX_VOICE_MESSAGES = 5;

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [voiceCount, setVoiceCount] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadOrCreateConversation();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (voiceCount >= MAX_VOICE_MESSAGES && isVoiceMode) {
      setIsVoiceMode(false);
      toast({
        title: "Ovozli Xabar Limiti",
        description: "Matn rejimiga o'tildi. Ovozli xabarlar limiti: 5 ta.",
      });
    }
  }, [voiceCount, isVoiceMode, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("*, messages(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
        setMessages(existing.messages || []);
        setVoiceCount(existing.voice_messages_count || 0);
      } else {
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setConversationId(newConv.id);
        setMessages([]);
        
        const welcomeMsg: Message = {
          id: "welcome",
          content: "Salom! Men sizning AI yordamchingizman. Bugun qanday yordam bera olaman? Konsalting xizmatlarimiz haqida so'rashingiz yoki xarajatlarni kuzatish uchun kalkulyator tugmasidan foydalanishingiz mumkin.",
          is_ai: true,
          message_type: "text",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMsg]);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Xatolik",
        description: "Suhbatni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, type: "voice" | "text") => {
    if (!conversationId || !content.trim()) return;
    setIsSending(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      is_ai: false,
      message_type: type,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content,
        message_type: type,
        is_ai: false,
      });

      if (type === "voice") {
        setVoiceCount((prev) => prev + 1);
        await supabase
          .from("conversations")
          .update({ voice_messages_count: voiceCount + 1 })
          .eq("id", conversationId);
      }

      setTimeout(async () => {
        const aiResponse = generateAIResponse(content);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          is_ai: true,
          message_type: "text",
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          content: aiResponse,
          message_type: "text",
          is_ai: true,
        });

        setIsSending(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Xatolik",
        description: "Xabarni yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
      setIsSending(false);
    }
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("narx") || lowerInput.includes("qiymat")) {
      return "Bizning konsalting xizmatlarimiz sizning ehtiyojlaringizga moslashtirilgan. Asosiy konsultatsiya soatiga 99$ dan boshlanadi. Davom etayotgan loyihalar uchun biz paketli shartnomalar taklif qilamiz. Sizga aniq hisob-kitob qilishda yordam beraymi?";
    }
    if (lowerInput.includes("hujjat") || lowerInput.includes("fayl")) {
      return "Siz hujjatlaringizni 'Hujjatlar' bo'limida boshqarishingiz mumkin. Men rasmlarni PDF ga o'zgartirish, fayllarni arxivlash yoki yuklamalarni tartiblashda yordam bera olaman. Shunchaki navigatsiyadagi 'Hujjatlar' belgisini bosing!";
    }
    if (lowerInput.includes("kalkulyator") || lowerInput.includes("xarajat")) {
      return "'Hisob-kitoblar' bo'limi sizga xarajatlarni toifalar bo'yicha (Transport, Oziq-ovqat, Xizmatlar va h.k.) kuzatish, valyutalarni konvertatsiya qilish va hisob-kitoblarni eksport qilish imkonini beradi. Xarajatlarni kuzatishda yordam beraymi?";
    }
    if (lowerInput.includes("yordam") || lowerInput.includes("qollab-quvvatlash")) {
      return "Men yordam berish uchun shu yerdaman! Siz: 1) Xizmatlarimiz haqida savollar berishingiz 2) Hujjatlar bilan yordam olishingiz 3) Xarajatlarni kuzatishingiz 4) Yoki shoshilinch yordam uchun qizil SOS tugmasini ishlatishingiz mumkin. Sizga nima kerak?";
    }
    
    return "Xabaringiz uchun rahmat. Siz so'rayotgan mavzu: \"" + input.substring(0, 50) + "...\". Men sizga bu borada yordam bera olaman. Konsalting xizmatlarimizning qaysi biriga ko'proq qiziqishingizni bilsam bo'ladimi?";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue, isVoiceMode ? "voice" : "text");
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Eksport Boshlandi",
      description: "Suhbat tarixingiz PDF fayliga eksport qilinmoqda...",
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white">Suhbat yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-700 bg-black/50 backdrop-blur-lg px-4 py-3 pt-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">AI Yordamchi</h1>
              <p className="text-xs text-gray-400">
                {isVoiceMode 
                  ? `Ovozli rejim (${MAX_VOICE_MESSAGES - voiceCount} qoldi)` 
                  : "Matn rejimi"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/calculator")} className="text-blue-400 hover:bg-black/40">
              <Calculator className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={exportToPDF} className="text-blue-400 hover:bg-black/40">
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.is_ai ? "flex-row" : "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.is_ai
                  ? "bg-gradient-to-br from-blue-500 to-purple-600"
                  : "bg-gray-700"
              )}
            >
              {message.is_ai ? (
                <Bot className="h-4 w-4 text-white" />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <Card
              className={cn(
                "max-w-[80%] border-0",
                message.is_ai
                  ? "bg-black/30 shadow-lg shadow-blue-500/10 text-white"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
              )}
            >
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    message.is_ai ? "text-gray-400" : "text-white/70"
                  )}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <Card className="bg-black/30 shadow-lg shadow-blue-500/10 border-0">
              <CardContent className="p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-20 border-t border-gray-700 bg-black/50 backdrop-blur-lg p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant={isVoiceMode ? "telegram" : "outline"}
            size="icon"
            onClick={() => voiceCount < MAX_VOICE_MESSAGES && setIsVoiceMode(!isVoiceMode)}
            disabled={voiceCount >= MAX_VOICE_MESSAGES}
            className={cn(
              isVoiceMode ? "bg-red-600/90 hover:bg-red-700/90" : "bg-black/40 text-red-400 hover:bg-black/50 border-gray-700"
            )}
          >
            {isVoiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isVoiceMode ? "Ovozli xabar..." : "Xabar yozing..."}
            className="flex-1 bg-black/40 border-gray-700 text-white"
            disabled={isSending}
          />
          <Button type="submit" variant="telegram" size="icon" disabled={!inputValue.trim() || isSending} className="bg-blue-600/90 hover:bg-blue-700/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}