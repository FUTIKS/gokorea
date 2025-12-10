// /src/pages/Chat.tsx - TO'LIQ YANGILANGAN KOD (TTS Xato Tashxisi Qo'shildi)

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
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  is_ai: boolean;
  message_type: "voice" | "text";
  created_at: string;
}

// === KNOWLEDGE BASE (Berilgan ma'lumotlar saqlandi) ===
const knowledgeBase = {
  narxlar: `💳 Go Korea Consulting Xizmatlari Narxlari:
1. Oldindan To'lov (Shartnoma va Hujjatlar uchun): Summasi: 2,000,000 So'm. Shartnoma imzolangan kuni to'lanadi. Oldindan to'lovdan keyin VIZA chiqquniga qadar boshqa to'lov talab qilinmaydi.
2. Oxirgi To'lov (Firma Xizmati uchun): Summasi: 1900 USD. VIZA qo'lingizga tegganidan so'ng (Fevral-Mart oylarida) to'lanadi.
ℹ️ Konsalting Xizmatiga Kiritilganlar: Koreya universitetlariga hujjat topshirish, qabul jarayonini to'liq nazorat qilish va viza olishda yordam berish. Hujjatlarni apostil, tarjima va boshqa kerakli xarajatlar oldindan to'lovga kiritilgan.`,
  kurslar: `🇰🇷 Koreys Tili Kurslari (D-4 Viza):
📅 Davomiylik: 6 oy (har bir daraja uchun).
🗓️ Boshlanish: Mart, Iyun, Sentyabr, Dekabr (yiliga 4 marta).
⏰ Dars vaqti: Haftada 5 kun, kuniga 4 soat (09:00 - 13:00).
💵 Narx: 1,500,000 KRW (bir semestr, 3 oy).
📄 Asosiy Hujjat Talablari (Viza uchun): 1. Zagran pasport, 2. ID yoki Yashil pasport, 3. Rasm 3x4 JPG, 4. Ota-ona pasportlari, 5. Metrika, 6. IELTS/TOPIK (agar bo'lsa), 7. Diplom (asl), 8. 2025 Bitiruvchilar uchun: 1-7 semestr baholar va Ma'lumotnoma.
✈️ Viza: Til kurslari uchun D-4 viza.`,
  universitetlar: [
    { name: "Woosuk Universiteti", shahar: "Jeonju", kontrakt: "$2,200 - $2,500 / semestr", afzallik: "Past narx, stipendiya, zamonaviy yotoqxona. Qabul: Standart." },
    { name: "Baekseok Universiteti", shahar: "Cheonan", kontrakt: "$2,500 - $2,700 / semestr", afzallik: "Seulga 1 soat, zamonaviy kampus. Qabul: Standart." },
    { name: "Daeshin Universiteti", shahar: "Gyeongsan", kontrakt: "$2,600 - $2,800 / semestr", afzallik: "Tinch shahar, individual e'tibor. Qabul: Intervyu." },
    { name: "BUFS (Busan Xorijiy Tillar Universiteti)", shahar: "Busan", kontrakt: "$2,400 - $2,600 / semestr", afzallik: "Xorijiy tillar, dengiz bo'yida, stipendiya. Qabul: Intervyu." },
    { name: "Sungkyul Universiteti", shahar: "Anyang", kontrakt: "$2,600 - $2,800 / semestr", afzallik: "Seulga 30 daqiqa, shaxsiy yondashuv. Qabul: Standart." },
    { name: "Singyeongju Universiteti", shahar: "Gyeongju", kontrakt: "$2,800 - $3,000 / semestr", afzallik: "Tarixiy shahar, turizm yo'nalishi kuchli. Qabul: Intervyu." },
    { name: "Hansung Universiteti", shahar: "Seoul", kontrakt: "$3,200 - $3,400 / semestr", afzallik: "Seul markazida, dizayn/IT kuchli. Qabul: Intervyu." },
  ],
  aloqa: `📞 Kontakt ma'lumotlari:
• Telefon raqamlari: +998 33 9391515, +998 97 9481515
• Telegram Adminlari: @gokorea_admin, @gokorea_shahriyor
• Telegram Kanalimiz: Yangiliklar uchun kanalimizni kuzating!
• Saytimiz: https://gokoreakonsalting.vercel.app/`,
};
// === KNOWLEDGE BASE END ===

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
  
  // Brauzer TTS'ni to'liq o'chirib, faqat API ovozini boshqarish uchun True qoldirildi
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true); 
  const [autoListenEnabled, setAutoListenEnabled] = useState(true); 
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const recognitionRef = useRef<any>(null);
  // Brauzer TTS referensi olib tashlandi
  const currentApiAudioRef = useRef<HTMLAudioElement | null>(null); // TTS API audioni boshqarish uchun

  // === Lifecycle va Effectlar ===
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
        requestMicrophonePermission(autoListenEnabled); 
      }, 800);
    }
  }, [conversationId, messages, hasGreeted, voiceSupported, autoListenEnabled]);
  
  // === Ovoz funksiyalari (TTS/ASR) ===

  const checkVoiceSupport = () => {
    // Faqat ASR (Tinglash) ni tekshirish qoldirildi
    const recognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(recognitionSupported); 

    if (!recognitionSupported) {
      toast({
        title: "Ovoz funksiyalari",
        description: "Brauzeringiz ovoz funksiyalarini to'liq qo'llab-quvvatlamaydi",
        variant: "destructive",
      });
    }
  };

  const requestMicrophonePermission = async (autoStartListening = false) => {
    try {
      // Streamni tekshirish, ruxsat olgandan so'ng to'xtatish
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      
      const greetingText = "Assalomu alaykum! Men Go Korea assistentiman. Sizga qanday yordam bera olaman? Qanday savolingiz bor?";
      speak(greetingText, autoStartListening);
      
      toast({
        title: "Mikrofon yoqildi",
        description: "Endi siz ovozli xabarlar yuborishingiz mumkin",
      });
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      setAutoSpeakEnabled(false);
      setAutoListenEnabled(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'uz-UZ';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript; 
        
        if (transcript.trim() && !isSending && !isSpeaking) {
          recognitionRef.current?.stop(); 
          setInputValue(transcript);
          
          toast({ title: "Ovoz tanildi", description: transcript });
          
          setAutoListenEnabled(false); 
          sendMessage(transcript, "voice");
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (autoListenEnabled && !isSending && event.error !== 'not-allowed' && event.error !== 'aborted') {
            setTimeout(() => {
                 toggleListening(true);
            }, 500); 
        } else if (event.error === 'not-allowed') {
          setMicPermission('denied');
          setAutoListenEnabled(false);
          toast({
            title: "Ruxsat berilmadi",
            description: "Mikrofon ruxsatini brauzer sozlamalaridan yoqing",
            variant: "destructive",
          });
        }
      };
    }
  };

// =================================================================================
// === TTS API INTEGRATSIYASI FUNKSIYASI (Yuqori sifatli ovoz) ===
// !!! MUHIM: Xatolarni aniqlash uchun bu qism YANGILANDI !!!
// =================================================================================
  const playApiAudio = async (text: string, startListeningAfter: boolean) => {
    if (!voiceSupported || !autoSpeakEnabled) return; 

    try {
        stopSpeaking(); 
        setIsSpeaking(true);
        
        // Backend API Endpoint'ga chaqiruv
        const response = await fetch('/api/tts', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }), 
        });

        if (!response.ok) {
            setIsSpeaking(false);
            
            // Xatolik xabarini chiqarish
            let errorText = await response.text();
            
            toast({
                title: `TTS API Xatosi: ${response.status}`,
                description: `Server xatosi. Status: ${response.status}. Javob: ${errorText.substring(0, 50)}...`, // Xatolikni ko'rsatish
                variant: "destructive",
            });
            
            throw new Error(`TTS API xatosi: ${response.statusText}. Status: ${response.status}`); 
        }

        const audioBlob = await response.blob();
        
        // Audio hajmini tekshirish (Audio o'rniga xato matni kelishini tekshirish)
        if (audioBlob.size < 1000) { 
             setIsSpeaking(false);
             toast({
                title: "TTS Xatosi: Kichik Audio",
                description: `TTS Serverdan audio olinmadi. Serverda Autentifikatsiya muammosi bo'lishi mumkin. Audio hajmi: ${audioBlob.size} byte.`,
                variant: "destructive",
            });
            throw new Error("TTS serverdan noto'g'ri (juda kichik) audio fayl olindi.");
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        currentApiAudioRef.current = audio; 

        audio.onended = () => {
            setIsSpeaking(false);
            if (startListeningAfter || autoListenEnabled) {
                toggleListening(true);
            }
            URL.revokeObjectURL(audioUrl); 
            currentApiAudioRef.current = null;
        };
        
        audio.onerror = () => {
             console.error("Audio playback error: Fayl o'ynalmadi.");
             setIsSpeaking(false);
             toast({
                title: "Audio O'ynatish Xatosi",
                description: "Olingan audio fayl noto'g'ri formatda yoki buzilgan.",
                variant: "destructive",
            });
             URL.revokeObjectURL(audioUrl);
             currentApiAudioRef.current = null;
        }
        
        await audio.play();

    } catch (error) {
        console.error("TTS API call error: Ulanish xatosi:", error);
        // Agar xato yuqorida aniq status code bilan ko'rsatilmagan bo'lsa (Masalan, 404 yoki Connection Refused)
        if (!isSpeaking) {
             toast({
                title: "Ulanish Xatosi (404/Refused)",
                description: "Backend serveri /api/tts endpointini topa olmadi yoki ulanish rad etildi.",
                variant: "destructive",
            });
        }
        setIsSpeaking(false); 
    }
  }


  const speak = (text: string, startListeningAfter = false) => {
    if (!autoSpeakEnabled) {
       if (startListeningAfter) toggleListening(true); 
       return;
    }
    
    stopSpeaking(); 
    
    // Faqat API funksiyasini chaqiramiz
    playApiAudio(text, startListeningAfter);
  };


  const stopSpeaking = () => {
    // API orqali yuklangan audioni to'xtatish
    if (currentApiAudioRef.current) {
        currentApiAudioRef.current.pause();
        currentApiAudioRef.current.currentTime = 0;
        // Audio manbasini tozalash (agar hali tozalab ulgurmagan bo'lsa)
        if (currentApiAudioRef.current.src) {
             URL.revokeObjectURL(currentApiAudioRef.current.src); 
        }
        currentApiAudioRef.current = null;
    }
    
    setIsSpeaking(false);
  };
// ... Qolgan kod o'zgarishsiz qoladi

  const toggleListening = (forceStart = false) => {
    // ... (Qolgan kod o'zgarishsiz qoladi)
    if (!voiceSupported) {
      toast({ title: "Xatolik", description: "Ovoz funksiyasi mavjud emas", variant: "destructive" });
      return;
    }

    if (micPermission === 'denied') {
      toast({ title: "Ruxsat kerak", description: "Mikrofon ruxsatini brauzer sozlamalaridan yoqing", variant: "destructive" });
      return;
    }

    if (micPermission === 'prompt') {
      requestMicrophonePermission(true);
      return;
    }

    if (isListening && !forceStart) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else if (forceStart || !isListening) {
      if (isSpeaking) {
        stopSpeaking();
      }
      try {
        // Avval to'xtatish va keyin boshlash, ehtiyot chorasi
        recognitionRef.current?.stop(); 
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };
  
  const toggleAutoListen = () => {
      // ... (Qolgan kod o'zgarishsiz qoladi)
      const newState = !autoListenEnabled;
      setAutoListenEnabled(newState);
      if (newState) {
          toggleListening(true);
          toast({ title: "Avtomatik tinglash yoqildi", description: "AI gapirib bo'lgach, avtomatik tinglashni boshlaydi." });
      } else {
          recognitionRef.current?.stop();
          toast({ title: "Avtomatik tinglash o'chirildi", description: "AI gapirib bo'lgach, tinglashni avtomatik boshlamaydi." });
      }
  };

  // === Chat mantiqi ===
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const loadOrCreateConversation = async () => {
    // ... Supabase mantiqi (O'zgarishsiz)
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
          content: "Salom! Men Go Korea konsalting kompaniyasi uchun AI yordamchingizman. Universitetlar, narxlar yoki kurslar haqida savol bering!",
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
  
  const exportToPDF = () => {
    // ... (O'zgarishsiz)
    toast({
      title: "Eksport Boshlandi",
      description: "Suhbat tarixingiz PDF fayliga eksport qilinmoqda (bu funksiya hozircha simulyatsiya qilingan)...",
    });
  };


  const sendMessage = async (content: string, type: "voice" | "text") => {
    if (!conversationId || !content.trim()) return;
    setIsSending(true);
    
    // Tinglash jarayonini to'xtatish
    if (isListening) {
         recognitionRef.current?.stop();
    }

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

      // Faqat API orqali ovoz chiqarish
      if (autoSpeakEnabled) {
        speak(aiResponse, autoListenEnabled); 
      } else if (autoListenEnabled) {
          // Agar ovoz o'chirilgan bo'lsa ham, avtomatik tinglashni boshlash kerak
          toggleListening(true);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Xatolik", description: "Xabarni yuborishda xatolik yuz berdi", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };


  const generateAIResponse = (input: string): string => {
    // ... (O'zgarishsiz qolgan AI mantiqi)
    const lowerInput = input.toLowerCase().replace(/[^a-zа-я\s]/g, '');
    
    // Universitetlarga oid savollar
    const uniName = knowledgeBase.universitetlar.find(u => lowerInput.includes(u.name.toLowerCase().replace(" universiteti", "")));
    if (uniName) {
        return `🎓 ${uniName.name} haqida ma'lumot:
Shahar: ${uniName.shahar}
Kontrakt (1 Semestr): ${uniName.kontrakt}
Afzalliklari: ${uniName.afzallik}`;
    }
    
    // Asosiy ma'lumotlarga oid so'rovlar
    if (lowerInput.includes("narx") || lowerInput.includes("qiymat") || lowerInput.includes("pul") || lowerInput.includes("to'lov")) {
      return knowledgeBase.narxlar;
    }
    if (lowerInput.includes("kurs") || lowerInput.includes("d-4") || lowerInput.includes("til")) {
      return knowledgeBase.kurslar;
    }
    if (lowerInput.includes("hujjat") || lowerInput.includes("talablar") || lowerInput.includes("viza")) {
      return knowledgeBase.kurslar; 
    }
    if (lowerInput.includes("aloqa") || lowerInput.includes("admin") || lowerInput.includes("telefon")) {
      return knowledgeBase.aloqa;
    }
    if (lowerInput.includes("universitet") || lowerInput.includes("univer")) {
        const uniList = knowledgeBase.universitetlar.map(u => u.name).join(", ");
        return `Bizning hamkor universitetlarimiz: ${uniList}. Qaysi biri haqida batafsil ma'lumot olishni xohlaysiz?`;
    }
    
    // Standart/Yordam javobi
    if (lowerInput.includes("yordam") || lowerInput.includes("salom") || lowerInput.includes("qanday") || lowerInput.includes("assalomu aleykum")) {
      return "Assalomu alaykum! Men Go Korea konsalting AI assistentiman. Sizga Koreyadagi universitetlar, kurslar, narxlar yoki aloqa ma'lumotlari haqida ma'lumot berishim mumkin. Qanday savolingiz bor?";
    }
    
    // Boshqa javoblar
    return "Xabaringiz uchun rahmat. Men bu savolingiz bo'yicha aniq ma'lumotga ega emasman. Iltimos, Koreya konsalting xizmatlari (Universitetlar, Kurslar, Narxlar, Aloqa) bo'yicha savol bering.";
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue, "text");
    }
  };


  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white">Suhbat yuklanmoqda...</div>
      </div>
    );
  }

  // === UI qismi (O'zgarishsiz) ===
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
            
            {/* Avtomatik Tinglashni Yoqish/O'chirish (Doimiy eshitish rejimi) */}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={toggleAutoListen} 
              className={cn(
                "hover:bg-black/40",
                autoListenEnabled ? "text-green-400" : "text-gray-500"
              )}
              disabled={!voiceSupported}
            >
              <Headphones className="h-4 w-4" />
            </Button>
            
            {/* Ovozli javobni yoqish/o'chirish */}
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => {
                setAutoSpeakEnabled(!autoSpeakEnabled);
                if (!autoSpeakEnabled) {
                  toast({ title: "Ovoz yoqildi", description: "AI javoblari endi ovoz bilan o'qiladi" });
                } else {
                    stopSpeaking();
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
            onClick={() => toggleListening(false)}
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