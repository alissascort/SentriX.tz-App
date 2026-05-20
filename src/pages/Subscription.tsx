import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Zap, Crown, CreditCard, ArrowLeft, Loader2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SentriXLogo from "@/components/SentriXLogo";

import mpesaLogo from "@/assets/m-pesa.jpg";
import airtelLogo from "@/assets/Airtel 1.jpeg";
import halotelLogo from "@/assets/Halotel.png";
import mixxLogo from "@/assets/YAS.jpeg";

import crdbbankLogo from "@/assets/crdb-logo.jpg";
import nmbbankLogo from "@/assets/nmb-bank.png";
import nbcbankLogo from "@/assets/nbc-bank.png";
import stanbicbankLogo from "@/assets/stanbic-bank.png";
import dtbbankLogo from "@/assets/diamond-trust-bank-dtb.png";
import equitybankLogo from "@/assets/equity-bank.png";
import eximbankLogo from "@/assets/exim-bank.png";
import kcbbankLogo from "@/assets/kcb-group-plc.png";

const API_BASE = 'http://localhost:3000';

const SNIPPE_PROVIDERS: Record<string, string> = {
  mpesa: 'vodacom',
  airtel: 'airtel',
  mixx: 'mixx',
  halopesa: 'halotel',
};

const PLAN_PRICES: Record<string, { amount: number; label: string }> = {
  "Free": { amount: 0, label: "Free" },
  "Starter": { amount: 49000, label: "49,000 TZS" },
  "Business": { amount: 200000, label: "200,000 TZS" },
  "Enterprise": { amount: 0, label: "Custom" },
};

const plans = [
  {
    name: "Free", icon: Shield, price: "$0", period: "", devices: "Up to 3 devices",
    features: ["Basic monitoring", "Email alerts", "1 user", "Monthly reports"],
    popular: false,
    isFree: true,
  },
  {
    name: "Starter", icon: Shield, price: "$49", period: "/mo", devices: "Up to 10 devices",
    features: ["Basic threat monitoring", "Email alerts", "5 users", "Monthly reports", "Standard support"],
    popular: false,
  },
  {
    name: "Business", icon: Zap, price: "$200", period: "/mo", devices: "Up to 50 devices",
    features: ["Advanced threat detection", "Push + Email + SMS alerts", "25 users", "Weekly reports", "Priority support", "API access"],
    popular: true,
  },
  {
    name: "Enterprise", icon: Crown, price: "Custom", period: "", devices: "Unlimited devices",
    features: ["Full SOC monitoring", "All alert channels", "Unlimited users", "Real-time reports", "24/7 dedicated support", "Full API & SDK access", "Custom integrations"],
    popular: false,
  },
];

const mobilePaymentMethods = [
  { id: "mpesa", name: "M-Pesa", logo: mpesaLogo },
  { id: "airtel", name: "Airtel Money", logo: airtelLogo },
  { id: "mixx", name: "Mixx by Yas", logo: mixxLogo },
  { id: "halopesa", name: "HaloPesa", logo: halotelLogo },
];

const banks = [
  { id: "crdb", name: "CRDB Bank", logo: crdbbankLogo },
  { id: "nmb", name: "NMB Bank", logo: nmbbankLogo },
  { id: "nbc", name: "NBC Bank", logo: nbcbankLogo },
  { id: "stanbic", name: "Stanbic Bank", logo: stanbicbankLogo },
  { id: "dtb", name: "DTB Bank", logo: dtbbankLogo },
  { id: "equity", name: "Equity Bank", logo: equitybankLogo },
  { id: "exim", name: "Exim Bank", logo: eximbankLogo },
  { id: "kcb", name: "KCB Bank", logo: kcbbankLogo },
];

const PAYMENT_TIMEOUT = 120;

const Subscription = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentCategory, setPaymentCategory] = useState<"mobile" | "bank" | "card" | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [step, setStep] = useState<"plan" | "payment" | "input" | "processing" | "confirmed" | "failed">("plan");
  const [countdown, setCountdown] = useState(PAYMENT_TIMEOUT);
  const [processingMsg, setProcessingMsg] = useState("Initiating payment...");
  const [paymentRef, setPaymentRef] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (step !== "processing") return;
    if (countdown <= 0) { stopPolling(); setStep("failed"); return; }
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Processing messages
  useEffect(() => {
    if (step !== "processing") return;
    const msgs = [
      "Initiating payment...",
      "Connecting to Snippe gateway...",
      "Sending payment request...",
      "Waiting for confirmation...",
      "Check your phone for payment prompt..."
    ];
    let i = 0;
    const interval = setInterval(() => { i++; if (i < msgs.length) setProcessingMsg(msgs[i]); }, 3000);
    return () => clearInterval(interval);
  }, [step]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Initiate real payment via Snippe
  const initiatePayment = async () => {
    if (!selectedPlan || !selectedPayment || !phoneNumber) return;

    const planPrice = PLAN_PRICES[selectedPlan];
    if (!planPrice || planPrice.amount === 0) {
      setStep("confirmed");
      return;
    }

    const provider = SNIPPE_PROVIDERS[selectedPayment] || selectedPayment;

    try {
      const token = localStorage.getItem('sentrix_token');
      const response = await fetch(`${API_BASE}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: planPrice.amount,
          provider,
          phone_number: phoneNumber,
          plan: selectedPlan
        })
      });

      const data = await response.json();

      if (data.status === 'success' && data.data?.reference) {
        setPaymentRef(data.data.reference);
        startPolling(data.data.reference);
      } else {
        setStep("failed");
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setStep("failed");
    }
  };

  // Poll Snippe for payment status
  const startPolling = (reference: string) => {
    let attempts = 0;
    const maxAttempts = 40; // ~2 minutes

    pollingRef.current = setInterval(async () => {
      attempts++;

      try {
        const token = localStorage.getItem('sentrix_token');
        const response = await fetch(`${API_BASE}/api/payments/status/${reference}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.status === 'completed') {
          stopPolling();
          setStep("confirmed");
        } else if (data.status === 'failed' || attempts >= maxAttempts) {
          stopPolling();
          setStep("failed");
        }
      } catch (err) {
        if (attempts >= maxAttempts) {
          stopPolling();
          setStep("failed");
        }
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
    const plan = plans.find(p => p.name === planName);
    if (plan?.isFree) {
      navigate("/login");
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    const plan = plans.find(p => p.name === selectedPlan);
    if (plan?.isFree) {
      navigate("/login");
    } else {
      setStep("payment");
    }
  };

  const handleProceedToInput = (category: "mobile" | "bank" | "card", id: string) => {
    setPaymentCategory(category);
    setSelectedPayment(id);
    setStep("input");
  };

  const canSubmitPayment = () => {
    if (paymentCategory === "mobile") return phoneNumber.length >= 10;
    if (paymentCategory === "bank") return selectedBank && accountNumber.length >= 5;
    if (paymentCategory === "card") return cardNumber.length >= 13;
    return false;
  };

  const handleSubmitPayment = () => {
    if (paymentCategory === "card") {
      setStep("confirmed");
      return;
    }
    setCountdown(PAYMENT_TIMEOUT);
    setProcessingMsg("Initiating payment...");
    setStep("processing");
    initiatePayment();
  };

  const handleRetry = () => {
    stopPolling();
    setCountdown(PAYMENT_TIMEOUT);
    setProcessingMsg("Initiating payment...");
    setStep("processing");
    initiatePayment();
  };

  const goBackFromStep = () => {
    stopPolling();
    switch (step) {
      case "payment": setStep("plan"); break;
      case "input": setStep("payment"); setSelectedPayment(null); setPaymentCategory(null); break;
      case "failed": setStep("input"); break;
      default: navigate(-1);
    }
  };

  return (
    <div className="theme-dark flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          {step !== "confirmed" && step !== "processing" && (
            <button onClick={goBackFromStep} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {step === "plan" ? "Choose Plan" : step === "payment" ? "Payment Method" : step === "input" ? "Payment Details" : step === "processing" ? "Processing Payment" : step === "failed" ? "Payment Failed" : "Confirmed"}
            </h1>
          </div>
          <SentriXLogo size={32} animate={false} />
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Plan Selection */}
          {step === "plan" && (
            <motion.div key="plan" className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  className={`card-sentrix p-5 cursor-pointer transition-all relative ${selectedPlan === plan.name ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handlePlanSelect(plan.name)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {plan.popular && <span className="absolute -top-2 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                  {plan.isFree && <span className="absolute -top-2 right-4 bg-safe text-safe-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><plan.icon className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">{plan.devices}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-safe shrink-0" /> {f}</div>
                    ))}
                  </div>
                </motion.div>
              ))}
              <Button onClick={handleProceedToPayment} disabled={!selectedPlan} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
                {selectedPlan && plans.find(p => p.name === selectedPlan)?.isFree ? "Get Started Free" : "Continue to Payment"}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Payment Method Selection */}
          {step === "payment" && (
            <motion.div key="payment" className="space-y-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="card-sentrix p-4">
                <p className="text-xs text-muted-foreground">Selected Plan</p>
                <p className="text-base font-bold text-foreground">{selectedPlan}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Mobile Money</h3>
                <div className="grid grid-cols-2 gap-3">
                  {mobilePaymentMethods.map(pm => (
                    <div key={pm.id} onClick={() => handleProceedToInput("mobile", pm.id)} className="card-sentrix p-4 cursor-pointer transition-all flex flex-col items-center gap-2 hover:ring-2 hover:ring-primary/50">
                      <img src={pm.logo} alt={pm.name} className="h-10 w-10 rounded-lg object-contain" />
                      <span className="text-xs font-medium text-foreground">{pm.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Bank Transfer</h3>
                <div className="grid grid-cols-2 gap-3">
                  {banks.map(bank => (
                    <div key={bank.id} onClick={() => handleProceedToInput("bank", bank.id)} className="card-sentrix p-4 cursor-pointer transition-all flex flex-col items-center gap-2 hover:ring-2 hover:ring-primary/50">
                      <img src={bank.logo} alt={bank.name} className="h-10 w-10 rounded-lg object-contain" />
                      <span className="text-xs font-medium text-foreground">{bank.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Card Payment</h3>
                <div onClick={() => handleProceedToInput("card", "card")} className="card-sentrix p-4 cursor-pointer transition-all flex items-center gap-3 hover:ring-2 hover:ring-primary/50">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-primary" /></div>
                  <div><span className="text-sm font-medium text-foreground">Card Payment</span><p className="text-xs text-muted-foreground">Visa, Mastercard</p></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Input Details */}
          {step === "input" && (
            <motion.div key="input" className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="card-sentrix p-4">
                <p className="text-xs text-muted-foreground">Plan: <span className="text-foreground font-medium">{selectedPlan}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Method: <span className="text-foreground font-medium">
                  {paymentCategory === "mobile" ? mobilePaymentMethods.find(m => m.id === selectedPayment)?.name : paymentCategory === "bank" ? banks.find(b => b.id === selectedPayment)?.name : "Card Payment"}
                </span></p>
              </div>

              {paymentCategory === "mobile" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={mobilePaymentMethods.find(m => m.id === selectedPayment)?.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                    <span className="text-sm font-semibold text-foreground">{mobilePaymentMethods.find(m => m.id === selectedPayment)?.name}</span>
                  </div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</label>
                  <Input type="tel" placeholder="e.g. 0712 345 678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="bg-card border-border text-foreground h-12" maxLength={13} />
                  <p className="text-[10px] text-muted-foreground">Enter the phone number registered with {mobilePaymentMethods.find(m => m.id === selectedPayment)?.name}</p>
                </div>
              )}

              {paymentCategory === "bank" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={banks.find(b => b.id === selectedPayment)?.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                    <span className="text-sm font-semibold text-foreground">{banks.find(b => b.id === selectedPayment)?.name}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Number</label>
                    <Input type="text" placeholder="Enter your account number" value={accountNumber} onChange={e => { setAccountNumber(e.target.value); setSelectedBank(selectedPayment); }} className="bg-card border-border text-foreground h-12" maxLength={20} />
                  </div>
                </div>
              )}

              {paymentCategory === "card" && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Card Number</label>
                  <Input type="text" placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="bg-card border-border text-foreground h-12" maxLength={19} />
                </div>
              )}

              <Button onClick={handleSubmitPayment} disabled={!canSubmitPayment()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">Pay Now</Button>
            </motion.div>
          )}

          {/* STEP 4: Processing */}
          {step === "processing" && (
            <motion.div key="processing" className="space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="mb-6">
                  <Loader2 className="h-16 w-16 text-primary" />
                </motion.div>
                <h2 className="text-lg font-bold text-foreground mb-2">Processing Payment</h2>
                <motion.p key={processingMsg} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-muted-foreground text-center">{processingMsg}</motion.p>
              </div>
              <div className="card-sentrix p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Time remaining</span>
                  <span className={`text-lg font-mono font-bold ${countdown < 60 ? "text-destructive" : "text-primary"}`}>{formatTime(countdown)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2 overflow-hidden">
                  <motion.div className={`h-full rounded-full ${countdown < 60 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${(countdown / PAYMENT_TIMEOUT) * 100}%` }} />
                </div>
                {countdown < 60 && <p className="text-[10px] text-destructive mt-1">Payment will be declined if time runs out</p>}
              </div>
              <div className="card-sentrix p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Plan</span><span className="text-foreground font-medium">{selectedPlan}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Method</span><span className="text-foreground font-medium">
                  {paymentCategory === "mobile" ? mobilePaymentMethods.find(m => m.id === selectedPayment)?.name : paymentCategory === "bank" ? banks.find(b => b.id === selectedPayment)?.name : "Card Payment"}
                </span></div>
                {paymentRef && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reference</span><span className="text-foreground font-mono font-medium text-[10px]">{paymentRef}</span></div>}
              </div>
              <p className="text-center text-[10px] text-muted-foreground">Check your phone for the payment prompt. Do not close this screen.</p>
            </motion.div>
          )}

          {/* STEP 5: Confirmed */}
          {step === "confirmed" && (
            <motion.div key="confirmed" className="space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center py-8">
                <div className="h-16 w-16 rounded-full bg-safe/20 flex items-center justify-center mb-4"><Check className="h-8 w-8 text-safe" /></div>
                <h2 className="text-xl font-bold text-foreground">Payment Confirmed</h2>
                <p className="text-sm text-muted-foreground mt-1 text-center">Your {selectedPlan} plan is now active.</p>
              </div>
              <div className="card-sentrix p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Plan</span><span className="text-foreground font-medium">{selectedPlan}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Payment</span><span className="text-foreground font-medium">
                  {paymentCategory === "mobile" ? mobilePaymentMethods.find(m => m.id === selectedPayment)?.name : paymentCategory === "bank" ? banks.find(b => b.id === selectedPayment)?.name : "Card Payment"}
                </span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><span className="text-safe font-medium">Payment Confirmed</span></div>
              </div>
              <Button onClick={() => navigate("/login")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">Go to Login</Button>
            </motion.div>
          )}

          {/* STEP 6: Failed */}
          {step === "failed" && (
            <motion.div key="failed" className="space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col items-center py-8">
                <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4"><XCircle className="h-8 w-8 text-destructive" /></div>
                <h2 className="text-xl font-bold text-foreground">Payment Failed</h2>
                <p className="text-sm text-muted-foreground mt-1 text-center">
                  {countdown <= 0 ? "Payment window expired. The transaction was declined due to timeout." : "Transaction could not be completed. Please try again."}
                </p>
              </div>
              <div className="card-sentrix p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Plan</span><span className="text-foreground font-medium">{selectedPlan}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><span className="text-destructive font-medium">{countdown <= 0 ? "Timed Out" : "Failed"}</span></div>
              </div>
              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12"><RefreshCw className="mr-2 h-4 w-4" /> Retry Payment</Button>
                <Button onClick={() => { setStep("payment"); setSelectedPayment(null); setPaymentCategory(null); }} variant="outline" className="w-full border-border h-12">Change Payment Method</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Subscription;
