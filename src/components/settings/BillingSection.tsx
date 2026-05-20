import { useState, useEffect } from "react";
import { CreditCard, Loader2, CheckCircle2, X, Wallet, Smartphone, Building2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

const BillingSection = () => {
  const { toast } = useToast();
  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "bank" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"select" | "details" | "processing" | "success">("select");

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  useEffect(() => {
    const token = getToken();
    Promise.all([
      fetch(`${API_BASE}/api/subscriptions/current`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/subscriptions/plans`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([r1, r2]) => Promise.all([r1.json(), r2.json()])).then(([d1, d2]) => {
      if (d1.status === "success") setSub(d1.data);
      if (d2.status === "success") setPlans(d2.data?.plans || d2.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setPaymentStep("select"); setPaymentMethod(null); setSelectedPlan("");
    setPhoneNumber(""); setCardNumber(""); setCardExpiry(""); setCardCVC(""); setCardName("");
  };

  const handlePayment = async () => {
    setPaymentStep("processing"); setProcessing(true);
    try {
      const token = getToken();
      const plan = plans.find((p: any) => p.id === selectedPlan);
      
      if (paymentMethod === "mobile") {
        const r = await fetch(`${API_BASE}/api/payments/initiate`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: plan?.price || 0, provider: "vodacom", phone_number: phoneNumber, plan: selectedPlan })
        });
        const d = await r.json();
        if (d.status !== "success") throw new Error(d.message);
        let attempts = 0;
        const check = setInterval(async () => {
          attempts++;
          const sr = await fetch(`${API_BASE}/api/payments/status/${d.data.reference}`, { headers: { Authorization: `Bearer ${token}` } });
          const sd = await sr.json();
          if (sd.status === "completed" || attempts > 20) {
            clearInterval(check);
            if (sd.status === "completed") {
              setPaymentStep("success"); toast({ title: "Payment Successful" });
              setTimeout(() => { setShowUpgrade(false); resetForm(); window.location.reload(); }, 2500);
            } else { setPaymentStep("details"); toast({ title: "Timeout", variant: "destructive" }); }
          }
        }, 3000);
      } else if (paymentMethod === "card") {
        const r = await fetch(`${API_BASE}/api/payments/card`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: plan?.price || 0, plan: selectedPlan, customer: { firstname: cardName, email: "", phone: phoneNumber } })
        });
        const d = await r.json();
        if (d.status !== "success") throw new Error(d.message);
        if (d.data?.payment_url) window.open(d.data.payment_url, "_blank");
        setPaymentStep("success"); toast({ title: "Payment Initiated", description: "Complete payment on the secure checkout page." });
        setTimeout(() => { setShowUpgrade(false); resetForm(); }, 3000);
      } else if (paymentMethod === "bank") {
        const r = await fetch(`${API_BASE}/api/payments/bank`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: plan?.price || 0, bank_code: "CRDB", account_number: "015012345678", account_name: "SentriX Ltd", plan: selectedPlan })
        });
        const d = await r.json();
        if (d.status !== "success") throw new Error(d.message);
        setPaymentStep("success"); toast({ title: "Payment Submitted", description: "Your bank transfer is being processed." });
        setTimeout(() => { setShowUpgrade(false); resetForm(); }, 3000);
      }
    } catch (err: any) {
      toast({ title: "Payment Failed", description: err.message || "Try again.", variant: "destructive" });
      setPaymentStep("details");
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const cp = plans.find((p: any) => p.id === sub?.plan_name) || { id: "free", name: "Free", price: 0, features: {} };
  const pf = cp.features || { max_devices: 3, max_users: 1 };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Billing & Subscription</h3>
      <div className="card-sentrix p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-primary" /></div>
          <div><p className="text-base font-bold text-foreground">{cp.name} Plan</p><p className="text-xs text-muted-foreground">{pf.max_devices || 3} devices · {pf.max_users || 1} users</p></div>
          <span className="ml-auto text-lg font-bold text-foreground">{cp.price > 0 ? `$${cp.price}` : '$0'}<span className="text-xs text-muted-foreground">/mo</span></span>
        </div>
        <div className="space-y-2 text-xs mb-4">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-safe font-medium">Active</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Devices</span><span className="text-foreground">{sub?.usage?.devices?.used || 0} / {pf.max_devices || 3}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="text-foreground">{sub?.usage?.users?.used || 1} / {pf.max_users || 1}</span></div>
        </div>
        <div className="space-y-1.5 border-t border-border pt-3">
          {[{ label: "Reports", included: cp.features?.reports !== false }, { label: "API Access", included: cp.features?.api_access !== false }, { label: "SMS Alerts", included: cp.features?.sms !== false }, { label: "Priority Support", included: cp.features?.priority_support !== false }].map(f => (
            <div key={f.label} className="flex items-center gap-2 text-xs">{f.included ? <CheckCircle2 className="h-3 w-3 text-safe" /> : <X className="h-3 w-3 text-muted-foreground" />}<span className={f.included ? "text-foreground" : "text-muted-foreground"}>{f.label}</span></div>
          ))}
        </div>
      </div>
      {cp.id !== "enterprise" && (
        <Button onClick={() => { setShowUpgrade(true); setPaymentStep("select"); setPaymentMethod(null); }} className="w-full h-10 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"><Wallet className="h-4 w-4 mr-2" /> Upgrade Plan</Button>
      )}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => paymentStep === "select" && setShowUpgrade(false)}>
          <div className="card-sentrix p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {paymentStep === "select" && (
              <>
                <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-foreground">Upgrade Plan</h3><button onClick={() => setShowUpgrade(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button></div>
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Select Plan</p>
                  {plans.filter((p: any) => p.id !== "free").map((p: any) => (
                    <div key={p.id} className={`card-sentrix p-3 cursor-pointer transition-all ${selectedPlan === p.id ? "ring-2 ring-primary bg-primary/5" : ""}`} onClick={() => setSelectedPlan(p.id)}>
                      <div className="flex justify-between items-center"><span className="text-sm font-semibold text-foreground">{p.name}</span><span className="text-sm font-bold text-foreground">${p.price}/mo</span></div>
                      <p className="text-[10px] text-muted-foreground mt-1">{p.features?.max_devices || "—"} devices · {p.features?.max_users || "—"} users</p>
                    </div>
                  ))}
                </div>
                {selectedPlan && (<>
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payment Method</p>
                    <div className={`card-sentrix p-3 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === "mobile" ? "ring-2 ring-primary bg-primary/5" : ""}`} onClick={() => setPaymentMethod("mobile")}><div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Smartphone className="h-5 w-5 text-emerald-600" /></div><div className="flex-1"><p className="text-sm font-medium text-foreground">Mobile Money</p><p className="text-[10px] text-muted-foreground">M-Pesa, Airtel, Mixx, HaloPesa</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                    <div className={`card-sentrix p-3 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === "card" ? "ring-2 ring-primary bg-primary/5" : ""}`} onClick={() => setPaymentMethod("card")}><div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><span className="text-[8px] font-bold text-blue-700">VISA</span></div><div className="flex-1"><p className="text-sm font-medium text-foreground">Credit / Debit Card</p><p className="text-[10px] text-muted-foreground">Visa, Mastercard</p></div><div className="flex -space-x-1"><div className="h-5 w-8 rounded bg-blue-600 flex items-center justify-center text-[7px] font-bold text-white">VISA</div><div className="h-5 w-8 rounded bg-red-500 flex items-center justify-center text-[7px] font-bold text-white">MC</div></div></div>
                    <div className={`card-sentrix p-3 cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === "bank" ? "ring-2 ring-primary bg-primary/5" : ""}`} onClick={() => setPaymentMethod("bank")}><div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-amber-600" /></div><div className="flex-1"><p className="text-sm font-medium text-foreground">Bank Transfer</p><p className="text-[10px] text-muted-foreground">CRDB, NMB, NBC, Stanbic & more</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                  </div>
                  <Button onClick={() => setPaymentStep("details")} disabled={!paymentMethod} className="w-full h-9 text-xs">Continue <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
                </>)}
              </>
            )}
            {paymentStep === "details" && (
              <>
                <div className="flex items-center gap-2"><button onClick={() => setPaymentStep("select")}><ArrowLeft className="h-5 w-5 text-foreground" /></button><h3 className="text-lg font-bold text-foreground">{paymentMethod === "mobile" ? "Mobile Payment" : paymentMethod === "card" ? "Card Payment" : "Bank Transfer"}</h3></div>
                {paymentMethod === "mobile" && (<div className="space-y-3"><p className="text-xs text-muted-foreground">Enter your mobile money phone number to receive a USSD prompt.</p><label className="text-[10px] text-muted-foreground uppercase">Phone Number</label><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+255 712 345 678" className="h-10 text-sm" /></div>)}
                {paymentMethod === "card" && (<div className="space-y-3"><div><label className="text-[10px] text-muted-foreground uppercase">Cardholder Name</label><Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe" className="h-10 text-sm mt-1" /></div><div><label className="text-[10px] text-muted-foreground uppercase">Card Number</label><Input value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="4242 4242 4242 4242" className="h-10 text-sm mt-1" /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] text-muted-foreground uppercase">Expiry</label><Input value={cardExpiry} onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="MM/YY" className="h-10 text-sm mt-1" /></div><div><label className="text-[10px] text-muted-foreground uppercase">CVC</label><Input value={cardCVC} onChange={e => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 3))} type="password" placeholder="•••" className="h-10 text-sm mt-1" /></div></div></div>)}
                {paymentMethod === "bank" && (<div className="space-y-3"><div className="card-sentrix p-4 space-y-2 text-xs bg-muted/20"><div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="text-foreground font-medium">CRDB Bank</span></div><div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="text-foreground font-medium">0150 1234 5678</span></div><div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground font-medium">SentriX Ltd</span></div></div><label className="text-[10px] text-muted-foreground uppercase">Transaction Reference</label><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g. TB12345678" className="h-10 text-sm" /></div>)}
                <Button onClick={handlePayment} disabled={(paymentMethod === "mobile" && !phoneNumber) || (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCVC || !cardName)) || (paymentMethod === "bank" && !phoneNumber)} className="w-full h-10 text-xs">Pay ${plans.find((p: any) => p.id === selectedPlan)?.price || 0}</Button>
              </>
            )}
            {paymentStep === "processing" && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="loader" style={{transform:"rotateZ(45deg)",perspective:"1000px",borderRadius:"50%",width:"48px",height:"48px",color:"#50C878"}}><style>{`.loader:before,.loader:after{content:"";display:block;position:absolute;top:0;left:0;width:inherit;height:inherit;border-radius:50%;transform:rotateX(70deg);animation:1s spin linear infinite}.loader:after{color:#38bdf8;transform:rotateY(70deg);animation-delay:.4s}@keyframes spin{0%,100%{box-shadow:.2em 0px 0 0px currentcolor}12%{box-shadow:.2em .2em 0 0 currentcolor}25%{box-shadow:0 .2em 0 0px currentcolor}37%{box-shadow:-.2em .2em 0 0 currentcolor}50%{box-shadow:-.2em 0 0 0 currentcolor}62%{box-shadow:-.2em -.2em 0 0 currentcolor}75%{box-shadow:0px -.2em 0 0 currentcolor}87%{box-shadow:.2em -.2em 0 0 currentcolor}}`}</style></div>
                <p className="text-sm font-medium text-foreground">Processing Payment</p>
                <p className="text-xs text-muted-foreground text-center">Please wait while we process your payment securely...</p>
              </div>
            )}
            {paymentStep === "success" && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <div style={{animation:"bounce 0.8s ease infinite"}}><div className="h-16 w-16 rounded-full bg-safe/20 flex items-center justify-center"><Wallet className="h-8 w-8 text-safe" /></div></div>
                <CheckCircle2 className="h-8 w-8 text-safe" /><p className="text-lg font-bold text-foreground">Payment Successful!</p><p className="text-xs text-muted-foreground text-center">Your plan has been upgraded. Enjoy your new features!</p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
};

export default BillingSection;
