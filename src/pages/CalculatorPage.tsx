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
  Wallet,
  Coins,
  DollarSign,
  Euro,
  Users,
} from "lucide-react";
import Galaxy from "@/components/ui/Galaxy/Galaxy";

interface Calculation {
  id: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  calculated_at: string;
}

const categories = [
  { value: "transportation", label: "Transport", icon: Car, color: "blue" },
  { value: "food", label: "Ovqat", icon: Utensils, color: "green" },
  { value: "services", label: "Xizmatlar", icon: Briefcase, color: "purple" },
  { value: "other", label: "Boshqa", icon: MoreHorizontal, color: "orange" },
];

const currencies = [
  { code: "USD", symbol: "$", icon: DollarSign, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", icon: Euro, flag: "🇪🇺" },
  { code: "UZS", symbol: "so'm", icon: Coins, flag: "🇺🇿" },
  { code: "KRW", symbol: "₩", icon: Coins, flag: "🇰🇷" },
];

const exchangeRates: Record<string, Record<string, number>> = {
  USD: { USD: 1, EUR: 0.92, UZS: 12500, KRW: 1350 },
  EUR: { USD: 1.09, EUR: 1, UZS: 13600, KRW: 1470 },
  UZS: { USD: 0.00008, EUR: 0.000074, UZS: 1, KRW: 0.108 },
  KRW: { USD: 0.00074, EUR: 0.00068, UZS: 9.26, KRW: 1 },
};

export default function CalculatorPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  
  const [convertAmount, setConvertAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("UZS");
  const [convertedValue, setConvertedValue] = useState("");

  // DEBUG: isAdmin qiymatini konsolga chiqarish
  useEffect(() => {
    console.log("🔍 DEBUG - User:", user?.id);
    console.log("🔍 DEBUG - isAdmin:", isAdmin);
    console.log("🔍 DEBUG - authLoading:", authLoading);
  }, [user, isAdmin, authLoading]);

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
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculator
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
      setDisplay("Xatolik");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
  };

  const handleBackspace = () => {
    setDisplay(display.slice(0, -1) || "0");
  };

  // Expense
  const saveExpense = async () => {
    if (!user || !amount) {
      toast({
        title: "Diqqat",
        description: "Iltimos, miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }

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
        title: "✅ Saqlandi",
        description: "Xarajat muvaffaqiyatli saqlandi",
      });

      setAmount("");
      setDescription("");
      loadCalculations();
    } catch (error) {
      toast({
        title: "❌ Xatolik",
        description: "Xarajatni saqlashda xatolik",
        variant: "destructive",
      });
    }
  };

  // Converter
  const handleConvert = () => {
    if (!convertAmount) {
      toast({
        title: "Diqqat",
        description: "Iltimos, miqdorni kiriting",
        variant: "destructive",
      });
      return;
    }
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
      toast({
        title: "O'chirildi",
        description: "Xarajat o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "O'chirishda xatolik",
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const calcButtons = [
    { value: "7", type: "number" },
    { value: "8", type: "number" },
    { value: "9", type: "number" },
    { value: "÷", type: "operator" },
    { value: "4", type: "number" },
    { value: "5", type: "number" },
    { value: "6", type: "number" },
    { value: "×", type: "operator" },
    { value: "1", type: "number" },
    { value: "2", type: "number" },
    { value: "3", type: "number" },
    { value: "-", type: "operator" },
    { value: "0", type: "number" },
    { value: ".", type: "number" },
    { value: "=", type: "equals" },
    { value: "+", type: "operator" },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden pb-20 bg-[#0A122A]">
      
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-50">
        <Galaxy 
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.8} 
          hueShift={0}
          saturation={0.0}
          transparent={true} 
        />
      </div>

      <div className="relative z-10">

        <header className="pt-12 pb-6 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Hisob-kitob</h1>
              <p className="text-gray-400 text-sm mt-1">Hisoblagich va Xarajatlar</p>
            </div>
            
            {/* DEBUG tugmasi - doim ko'rsatiladi */}
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-400 text-right">
                Admin: {isAdmin ? "✅ HA" : "❌ YO'Q"}
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              {/* Vaqtinchalik test tugmasi - har doim ko'rsatiladi */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("🔵 Test Admin tugmasi bosildi!");
                  console.log("🔵 Navigatsiya: /admin");
                  navigate("/admin");
                }}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Users className="h-4 w-4 mr-2" />
                Test Admin
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-black/30 backdrop-blur-sm">
              <TabsTrigger value="calculator" className="text-white data-[state=active]:bg-blue-600/70">
                <Calculator className="h-4 w-4 mr-1" />
                Hisoblagich
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-white data-[state=active]:bg-blue-600/70">
                <Wallet className="h-4 w-4 mr-1" />
                Xarajatlar
              </TabsTrigger>
              <TabsTrigger value="converter" className="text-white data-[state=active]:bg-blue-600/70">
                <Coins className="h-4 w-4 mr-1" />
                Valyuta
              </TabsTrigger>
            </TabsList>

            {/* Hisoblagich */}
            <TabsContent value="calculator">
              <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="bg-black/50 rounded-xl p-4 mb-4 border border-blue-500/30">
                    <p className="text-sm text-gray-400 h-5 text-right">{equation}</p>
                    <p className="text-4xl font-bold text-right text-white break-all">{display}</p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <Button
                      variant="destructive"
                      className="col-span-2 h-12 bg-red-600/80 hover:bg-red-700/90 text-base font-semibold"
                      onClick={handleClear}
                    >
                      Tozalash
                    </Button>
                    <Button
                      variant="secondary"
                      className="col-span-2 h-12 bg-gray-700/50 hover:bg-gray-600/50 text-base font-semibold"
                      onClick={handleBackspace}
                    >
                      ⌫ O'chirish
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {calcButtons.map((btn) => (
                      <Button
                        key={btn.value}
                        className={`h-16 text-2xl font-bold transition-all ${
                          btn.type === "operator" || btn.type === "equals"
                            ? "bg-blue-600/80 hover:bg-blue-700/90 text-white" 
                            : "bg-gray-800/50 hover:bg-gray-700/60 text-white"
                        }`}
                        onClick={() => {
                          if (btn.value === "=") handleEquals();
                          else if (btn.type === "operator") {
                            const op = btn.value === "÷" ? "/" : btn.value === "×" ? "*" : btn.value;
                            handleOperator(op);
                          }
                          else handleNumber(btn.value);
                        }}
                      >
                        {btn.value}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Xarajatlar */}
            <TabsContent value="expenses">
              <Card className="border-0 shadow-lg bg-black/30 backdrop-blur-sm mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-400" />
                    Yangi Xarajat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Miqdorni kiriting"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 h-11 bg-black/40 border-gray-700 text-white text-base"
                    />
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-28 h-11 bg-black/40 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d1e] text-white">
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <div className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 bg-black/40 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d1e] text-white">
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <c.icon className="h-4 w-4 text-blue-400" />
                            <span>{c.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Izoh (majburiy emas)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-11 bg-black/40 border-gray-700 text-white"
                  />

                  <Button 
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-semibold" 
                    onClick={saveExpense}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Saqlash
                  </Button>
                </CardContent>
              </Card>

              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 px-1">
                Kategoriyalar bo'yicha
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {categories.map((cat) => {
                  const total = getCategoryTotal(cat.value);
                  return (
                    <Card key={cat.value} className="border-0 shadow-lg bg-black/30">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg bg-${cat.color}-600/30 flex items-center justify-center border border-${cat.color}-500/50`}>
                            <cat.icon className={`h-4 w-4 text-${cat.color}-400`} />
                          </div>
                          <p className="text-xs text-gray-400 font-medium">{cat.label}</p>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {total.toFixed(0)} {currency}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 px-1">
                Oxirgi xarajatlar
              </h3>
              <div className="space-y-2">
                {calculations.slice(0, 8).map((calc) => {
                  const cat = categories.find((c) => c.value === calc.category);
                  const Icon = cat?.icon || MoreHorizontal;
                  const curr = currencies.find(c => c.code === calc.currency);
                  return (
                    <Card key={calc.id} className="border-0 shadow-lg bg-black/30">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center border border-blue-500/50">
                          <Icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">
                            {calc.amount} {curr?.flag} {calc.currency}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {calc.description || cat?.label}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCalculation(calc.id)}
                          className="hover:bg-red-500/20 flex-shrink-0"
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    Valyuta Konvertori
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 text-sm mb-2 block">Qayerdan</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        className="flex-1 h-12 text-lg bg-black/40 border-gray-700 text-white"
                      />
                      <Select value={fromCurrency} onValueChange={setFromCurrency}>
                        <SelectTrigger className="w-28 h-12 bg-black/40 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d1e] text-white">
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <div className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{c.code}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={swapCurrencies}
                      className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 w-12 h-12"
                    >
                      <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-gray-300 text-sm mb-2 block">Qayerga</Label>
                    <div className="flex gap-2">
                      <Input
                        value={convertedValue}
                        readOnly
                        placeholder="0.00"
                        className="flex-1 h-12 text-lg bg-black/40 border-gray-700 text-white font-semibold"
                      />
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger className="w-28 h-12 bg-black/40 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d1e] text-white">
                          {currencies.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <div className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{c.code}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold" 
                    onClick={handleConvert}
                  >
                    Hisoblash
                  </Button>

                  {/* Kurs ma'lumoti */}
                  {convertAmount && convertedValue && (
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-400">Joriy kurs</p>
                      <p className="text-sm text-white font-medium mt-1">
                        1 {fromCurrency} = {exchangeRates[fromCurrency][toCurrency].toLocaleString()} {toCurrency}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}