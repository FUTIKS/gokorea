import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Car, 
  Utensils, 
  Briefcase, 
  MoreHorizontal,
  Save,
  Trash2,
  ArrowRightLeft,
  Wallet, // Xarajatlar Ikonkasi
  Coins // Valyuta Ikonkasi
} from "lucide-react";
import { cn } from "@/lib/utils";

// Galaxy komponentini import qilish
import Galaxy from "@/components/ui/Galaxy/Galaxy";

interface Calculation {
  id: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  calculated_at: string;
}

// O'zbekcha Kategoriya va Yorliqlar
const categories = [
  { value: "transportation", label: "Transport", icon: Car },
  { value: "food", label: "Oziq-ovqat", icon: Utensils },
  { value: "services", label: "Xizmatlar", icon: Briefcase },
  { value: "other", label: "Boshqa", icon: MoreHorizontal },
];

const currencies = ["USD", "EUR", "UZS"];
const exchangeRates: Record<string, Record<string, number>> = {
  USD: { USD: 1, EUR: 0.92, UZS: 12500 },
  EUR: { USD: 1.09, EUR: 1, UZS: 13600 },
  UZS: { USD: 0.00008, EUR: 0.000074, UZS: 1 },
};

export default function CalculatorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculator state
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  
  // Expense tracker state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  
  // Currency converter state
  const [convertAmount, setConvertAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("UZS");
  const [convertedValue, setConvertedValue] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadCalculations();
    }
  }, [user]);

  const loadCalculations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("calculations")
        .select("*")
        .eq("user_id", user.id)
        .order("calculated_at", { ascending: false });

      if (error) throw error;
      setCalculations((data as Calculation[]) || []);
    } catch (error) {
      console.error("Error loading calculations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculator functions (Xato matnlarini o'zgartirish)
  const handleNumber = (num: string) => {
    if (display === "0" || display === "Xatolik") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
  };

  const handleEquals = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation("");
    } catch {
      setDisplay("Xatolik"); // O'zbekchaga o'girildi
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
  };

  // Expense tracker (Toast xabarlari o'zgartirildi)
  const saveExpense = async () => {
    if (!user || !amount) return;

    try {
      const { error } = await supabase.from("calculations").insert({
        user_id: user.id,
        category,
        amount: parseFloat(amount),
        currency,
        description: description || null,
      });

      if (error) throw error;

      toast({
        title: "Saqlandi",
        description: "Xarajat muvaffaqiyatli saqlandi",
      });

      setAmount("");
      setDescription("");
      loadCalculations();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Xarajatni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  // Currency converter (Toast xabarlari o'zgartirildi)
  const handleConvert = () => {
    if (!convertAmount) return;
    const rate = exchangeRates[fromCurrency][toCurrency];
    const result = parseFloat(convertAmount) * rate;
    setConvertedValue(result.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedValue("");
  };

  const deleteCalculation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadCalculations();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "O'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const getCategoryTotal = (cat: string) => {
    return calculations
      .filter((c) => c.category === cat)
      .reduce((sum, c) => sum + Number(c.amount), 0);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A122A]">
        <div className="animate-pulse text-primary">Yuklanmoqda...</div>
      </div>
    );
  }

  const calcButtons = [
    "7", "8", "9", "÷",
    "4", "5", "6", "×",
    "1", "2", "3", "-",
    "0", ".", "=", "+",
  ];

  return (
    // 1. Umumiy fon va animatsiyani joylash
    <div className="min-h-screen w-full relative overflow-hidden pb-20 bg-[#0A122A] text-white">
      
      {/* Galaxy Animatsiyasi (Fon) */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-70">
        <Galaxy 
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.8} 
          hueShift={0}
          saturation={0.0}
          transparent={true} 
        />
      </div>

      {/* Kontent qismini Animatsiya ustiga chiqarish */}
      <div className="relative z-10">

        {/* Header */}
        <header className="pt-16 pb-6 px-4">
          <h1 className="text-2xl font-bold text-white">Hisob-kitoblar</h1>
          <p className="text-gray-400 mt-1">Xarajatlarni kuzatish va valyutalarni konvertatsiya qilish</p>
        </header>

        <div className="px-4 -mt-4">
          {/* Tabs */}
          <Tabs defaultValue="calculator" className="w-full">
            {/* TabsList ranglari va Fokus Tuzatish */}
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-black/30 backdrop-blur-sm border border-blue-500/30">
              <TabsTrigger value="calculator" className="text-white data-[state=active]:bg-blue-600/70 data-[state=active]:text-white focus-visible:ring-offset-0">Oddiy Hisoblagich</TabsTrigger>
              <TabsTrigger value="expenses" className="text-white data-[state=active]:bg-blue-600/70 data-[state=active]:text-white focus-visible:ring-offset-0">Xarajatlar</TabsTrigger>
              <TabsTrigger value="converter" className="text-white data-[state=active]:bg-blue-600/70 data-[state=active]:text-white focus-visible:ring-offset-0">Konvertatsiya</TabsTrigger>
            </TabsList>

            {/* Oddiy Kalkulyator */}
            <TabsContent value="calculator">
              <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  {/* Kalkulyator Ekrani */}
                  <div className="bg-black/40 rounded-lg p-4 mb-4 border border-blue-500/50">
                    <p className="text-xs text-gray-400 h-4 text-right">{equation}</p>
                    <p className="text-4xl font-extrabold text-right text-white">{display}</p>
                  </div>
                  {/* Tugmalar */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="destructive"
                      className="col-span-2 bg-red-600/70 hover:bg-red-700/80 focus-visible:ring-offset-0"
                      onClick={handleClear}
                    >
                      Tozalash
                    </Button>
                    <Button
                      variant="secondary"
                      className="col-span-2 bg-black/40 text-blue-400 hover:bg-black/50 focus-visible:ring-offset-0"
                      onClick={() => setDisplay(display.slice(0, -1) || "0")}
                    >
                      ⌫
                    </Button>
                    {calcButtons.map((btn) => (
                      <Button
                        key={btn}
                        className={cn(
                          "h-14 text-xl font-bold focus-visible:ring-offset-0",
                          ["÷", "×", "-", "+", "="].includes(btn) ? 
                            "bg-blue-600/80 hover:bg-blue-700/90 text-white" : // Operatorlar
                            "bg-black/50 text-white hover:bg-black/60" // Raqamlar
                        )}
                        onClick={() => {
                          if (btn === "=") handleEquals();
                          else if (["÷", "×", "-", "+"].includes(btn)) {
                            const op = btn === "÷" ? "/" : btn === "×" ? "*" : btn;
                            handleOperator(op);
                          }
                          else handleNumber(btn);
                        }}
                      >
                        {btn}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Xarajatlarni Kuzatish */}
            <TabsContent value="expenses">
              <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    Xarajat Qo'shish
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Miqdor"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                      />
                    </div>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-24 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d1e] text-white">
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d1e] text-white">
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <c.icon className="h-4 w-4 text-blue-400" />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Izoh (ixtiyoriy)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                  />
                  <Button variant="telegram" className="w-full bg-blue-600/80 hover:bg-blue-700/90 focus-visible:ring-offset-0" onClick={saveExpense}>
                    <Save className="h-4 w-4 mr-2" />
                    Xarajatni Saqlash
                  </Button>
                </CardContent>
              </Card>

              {/* Category Totals */}
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                Jami Xarajatlar
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {categories.map((cat) => (
                  <Card key={cat.value} className="border-0 shadow-lg bg-black/30">
                    <CardContent className="p-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                        <cat.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{cat.label}</p>
                        <p className="font-semibold text-sm text-white">
                          {getCategoryTotal(cat.value).toFixed(2)} {currency}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Expenses */}
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                So'nggi Xarajatlar
              </h3>
              <div className="space-y-2">
                {calculations.slice(0, 5).map((calc) => {
                  const cat = categories.find((c) => c.value === calc.category);
                  const Icon = cat?.icon || MoreHorizontal;
                  return (
                    <Card key={calc.id} className="border-0 shadow-lg bg-black/30">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50">
                          <Icon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-white">
                            {calc.amount} {calc.currency}
                          </p>
                          <p className="text-xs text-gray-400">
                            {calc.description || cat?.label}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteCalculation(calc.id)}
                          className="hover:bg-red-500/20 focus-visible:ring-offset-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Valyuta Konvertori */}
            <TabsContent value="converter">
              <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Coins className="h-4 w-4 text-yellow-400" />
                    Valyuta Konvertori
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-200">Qayerdan</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Miqdor"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        className="flex-1 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                      />
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-24 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d1e] text-white">
                          {currencies.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button variant="ghost" size="icon" onClick={swapCurrencies} className="bg-black/30 hover:bg-black/50 border border-gray-700 focus-visible:ring-offset-0">
                      <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-gray-200">Qayerga</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={convertedValue}
                        readOnly
                        placeholder="Natija"
                        className="flex-1 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0"
                      />
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-24 bg-black/40 border-gray-700 text-white focus-visible:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d1e] text-white">
                          {currencies.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button variant="telegram" className="w-full bg-blue-600/80 hover:bg-blue-700/90 focus-visible:ring-offset-0" onClick={handleConvert}>
                    Konvertatsiya Qilish
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}