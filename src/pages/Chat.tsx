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
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  message_type: "voice" | "text";
  created_at: string;
}

export default function Chat() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    checkVoiceSupport();
    initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (conversationId && !hasGreeted && messages.length > 0 && voiceSupported) {
      setHasGreeted(true);
      setTimeout(() => {
        requestMicrophonePermission();
      }, 800);
    }
  }, [conversationId, messages, hasGreeted, voiceSupported]);

  const checkVoiceSupport = () => {
    const speechSupported = 'speechSynthesis' in window;
    const recognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    setVoiceSupported(speechSupported && recognitionSupported);

    if (!speechSupported || !recognitionSupported) {
      toast({
        title: "Ovoz funksiyalari",
        description: "Brauzeringiz ovoz funksiyalarini to'liq qo'llab-quvvatlamaydi",
        variant: "destructive",
      });
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      
      const greetingText = "Assalomu alaykum! Men Go Korea assistentiman. Sizga qanday yordam bera olaman? Qanday savolingiz bor?";
      speak(greetingText);
      
      toast({
        title: "Mikrofon yoqildi",
        description: "Endi siz ovozli xabarlar yuborishingiz mumkin",
      });
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      setAutoSpeakEnabled(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'uz-UZ';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        
        toast({
          title: "Ovoz tanildi",
          description: transcript,
        });
        
        sendMessage(transcript, "voice");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast({
            title: "Ovoz eshitilmadi",
            description: "Iltimos, qaytadan urinib ko'ring",
            variant: "destructive",
          });
        } else if (event.error === 'not-allowed') {
          setMicPermission('denied');
          toast({
            title: "Ruxsat berilmadi",
            description: "Mikrofon ruxsatini brauzer sozlamalaridan yoqing",
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const speak = (text: string) => {
    if (!autoSpeakEnabled || !voiceSupported) return;
    
    stopSpeaking();
    
    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.addEventListener('voiceschanged', () => {
        performSpeak(text);
      }, { once: true });
    } else {
      performSpeak(text);
    }
  };

  const performSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synthRef.current.getVoices();
    const uzbekVoice = voices.find(v => v.lang.includes('uz')) || 
                       voices.find(v => v.lang.includes('ru')) ||
                       voices[0];
    
    if (uzbekVoice) {
      utterance.voice = uzbekVoice;
    }
    
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  };

  const toggleListening = async () => {
    if (!voiceSupported) {
      toast({
        title: "Xatolik",
        description: "Ovoz funksiyasi mavjud emas",
        variant: "destructive",
      });
      return;
    }

    if (micPermission === 'denied') {
      toast({
        title: "Ruxsat kerak",
        description: "Mikrofon ruxsatini brauzer sozlamalaridan yoqing",
        variant: "destructive",
      });
      return;
    }

    if (micPermission === 'prompt') {
      await requestMicrophonePermission();
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Xatolik",
          description: "Ovozni tanishda xatolik yuz berdi",
          variant: "destructive",
        });
      }
    }
  };

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
          content: "Salom! Men sizning AI yordamchingizman. Bugun qanday yordam bera olaman?",
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

        if (autoSpeakEnabled) {
          speak(aiResponse);
        }

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
      return "Siz hujjatlaringizni 'Hujjatlar' bo'limida boshqarishingiz mumkin. Men rasmlarni PDF ga o'zgartirish, fayllarni arxivlash yoki yuklamalarni tartiblashda yordam bera olaman.";
    }
    if (lowerInput.includes("kalkulyator") || lowerInput.includes("xarajat")) {
      return "Hisob-kitoblar bo'limi sizga xarajatlarni toifalar bo'yicha kuzatish, valyutalarni konvertatsiya qilish va hisob-kitoblarni eksport qilish imkonini beradi.";
    }
    if (lowerInput.includes("yordam") || lowerInput.includes("qollab")) {
      return "Men yordam berish uchun shu yerdaman! Siz xizmatlarimiz haqida savollar berishingiz, hujjatlar bilan yordam olishingiz yoki xarajatlarni kuzatishingiz mumkin. Sizga nima kerak?";
    }
    
    return "Xabaringiz uchun rahmat. Men sizga bu borada yordam bera olaman. Konsalting xizmatlarimizning qaysi biriga ko'proq qiziqishingizni bilsam bo'ladimi?";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue, "text");
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
      <header className="sticky top-0 z-30 border-b border-gray-700 bg-black/50 backdrop-blur-lg px-4 py-3 pt-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">AI Yordamchi</h1>
              <p className="text-xs text-gray-400">
                {isListening ? "🎤 Tinglamoqda..." : isSpeaking ? "🔊 Gapirmoqda..." : "✅ Onlayn"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!voiceSupported && (
              <Button variant="ghost" size="icon-sm" className="text-yellow-400 hover:bg-black/40">
                <AlertCircle className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => {
                setAutoSpeakEnabled(!autoSpeakEnabled);
                if (!autoSpeakEnabled) {
                  toast({
                    title: "Ovoz yoqildi",
                    description: "AI javoblari endi ovoz bilan o'qiladi",
                  });
                }
              }} 
              className={cn(
                "hover:bg-black/40",
                autoSpeakEnabled ? "text-blue-400" : "text-gray-500"
              )}
            >
              {autoSpeakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/calculator")} className="text-blue-400 hover:bg-black/40">
              <Calculator className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={exportToPDF} className="text-blue-400 hover:bg-black/40">
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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

      <div className="sticky bottom-0 z-20 border-t border-gray-700 bg-black/50 backdrop-blur-lg p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="telegram"
            size="icon"
            onClick={toggleListening}
            disabled={isSending || !voiceSupported}
            className={cn(
              isListening 
                ? "bg-red-600/90 hover:bg-red-700/90 animate-pulse" 
                : "bg-blue-600/90 hover:bg-blue-700/90",
              !voiceSupported && "opacity-50 cursor-not-allowed"
            )}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Gapiring..." : "Xabar yozing yoki mikrofon tugmasini bosing..."}
            className="flex-1 bg-black/40 border-gray-700 text-white"
            disabled={isSending || isListening}
          />
          <Button type="submit" variant="telegram" size="icon" disabled={!inputValue.trim() || isSending} className="bg-blue-600/90 hover:bg-blue-700/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}