import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, ArrowLeft, Check, Copy, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SentriXLogo from "@/components/SentriXLogo";
import { auth } from "@/services/api";

const industries = [
  "Technology", "Finance & Banking", "Healthcare", "Government",
  "Telecommunications", "Manufacturing", "Education", "Retail", "Energy", "Other"
];

const generateId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const STORAGE_KEY = 'sentrix_registration_form';

const CompanyRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step1Error, setStep1Error] = useState("");
  const [step2Error, setStep2Error] = useState("");
  
  const [form, setForm] = useState({
    companyName: "", regNumber: "", industry: "", country: "",
    companyEmail: "", phone: "", employees: "", devices: "", servers: "",
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [generatedIds, setGeneratedIds] = useState({ clientId: "", tenantId: "" });

    // Load saved form data on mount
  useEffect(() => {
    const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
    if (token) {
      // User already registered — clear saved draft
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Save form data on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const required = [
      { key: "companyName", label: "Company Name" },
      { key: "regNumber", label: "Registration Number" },
      { key: "country", label: "Country" },
      { key: "companyEmail", label: "Company Email" },
      { key: "phone", label: "Phone Number" },
      { key: "industry", label: "Industry" },
    ];
    
    for (const field of required) {
      if (!form[field.key as keyof typeof form]) {
        setStep1Error(`${field.label} is required`);
        return false;
      }
    }
    setStep1Error("");
    return true;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    if (!form.firstName) { setStep2Error("First name is required"); return false; }
    if (!form.lastName) { setStep2Error("Last name is required"); return false; }
    if (!form.email) { setStep2Error("Admin email is required"); return false; }
    if (!form.password) { setStep2Error("Password is required"); return false; }
    if (form.password.length < 8) { setStep2Error("Password must be at least 8 characters"); return false; }
    if (form.password !== form.confirmPassword) { setStep2Error("Passwords do not match"); return false; }
    setStep2Error("");
    return true;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await auth.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        companyName: form.companyName,
        registrationNumber: form.regNumber,
        industry: form.industry
      });
      if (response.status === 'success') {
        localStorage.removeItem(STORAGE_KEY); // Clear saved form
        setGeneratedIds({
          clientId: response.data?.client_id || `CID-${generateId()}`,
          tenantId: response.data?.tenant_id || `TID-${generateId()}`
        });
        setStep(3);
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError("Registration failed. Please check your information and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="theme-dark flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          {step > 1 && step < 3 && (
            <button onClick={() => setStep(step - 1)} className="p-1">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Company Registration</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
          </div>
          <SentriXLogo size={32} animate={false} />
        </div>
        <div className="flex gap-1.5 mt-3">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted/30"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        {step === 1 && (
          <motion.div className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="card-sentrix p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Information
              </h2>
              <p className="text-xs text-muted-foreground">All fields are required.</p>
              
              {[
                { label: "Company Name", key: "companyName", type: "text", placeholder: "Acme Corporation" },
                { label: "Registration Number", key: "regNumber", type: "text", placeholder: "REG-2024-XXXXX" },
                { label: "Country", key: "country", type: "text", placeholder: "Tanzania" },
                { label: "Company Email", key: "companyEmail", type: "email", placeholder: "info@company.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+255 XXX XXX XXX" },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {field.label} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => update(field.key, e.target.value)}
                    className="bg-muted/20 border-border text-foreground h-11"
                    required
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Industry <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.industry}
                  onChange={e => update("industry", e.target.value)}
                  className="flex h-11 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                >
                  <option value="" className="bg-card">Select Industry</option>
                  {industries.map(i => <option key={i} value={i} className="bg-card">{i}</option>)}
                </select>
              </div>
            </div>

            <div className="card-sentrix p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Infrastructure Details</h2>
              <p className="text-xs text-muted-foreground">Optional — helps us configure your setup.</p>
              {[
                { label: "Number of Employees", key: "employees", placeholder: "50" },
                { label: "Number of Devices", key: "devices", placeholder: "100" },
                { label: "Number of Servers", key: "servers", placeholder: "10" },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => update(field.key, e.target.value)}
                    className="bg-muted/20 border-border text-foreground h-11"
                  />
                </div>
              ))}
            </div>

            {step1Error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {step1Error}
              </div>
            )}

            <Button onClick={handleStep1Continue} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="card-sentrix p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Account Credentials</h2>
              <p className="text-xs text-muted-foreground">Create your personal admin account. All fields are required.</p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  First Name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="John"
                  value={form.firstName}
                  onChange={e => update("firstName", e.target.value)}
                  className="bg-muted/20 border-border text-foreground h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={e => update("lastName", e.target.value)}
                  className="bg-muted/20 border-border text-foreground h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin Email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                  className="bg-muted/20 border-border text-foreground h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => update("password", e.target.value)}
                    className="bg-muted/20 border-border text-foreground h-11 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                  className="bg-muted/20 border-border text-foreground h-11"
                  required
                />
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary">🔒 Password must be at least 8 characters with uppercase, lowercase, and a number.</p>
              </div>
            </div>

            {step2Error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {step2Error}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
              {loading ? "Registering..." : "Register Company"} <Check className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div className="space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex flex-col items-center py-6">
              <div className="h-16 w-16 rounded-full bg-safe/20 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-safe" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Registration Successful</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">Your company has been registered. Save your credentials below.</p>
            </div>

            <div className="card-sentrix p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Your Credentials</h3>
              {[
                { label: "Client ID", value: generatedIds.clientId },
                { label: "Tenant ID", value: generatedIds.tenantId },
              ].map(cred => (
                <div key={cred.label} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cred.label}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 rounded-md border border-border bg-muted/20 px-3 flex items-center">
                      <span className="text-xs text-foreground font-mono truncate">{cred.value}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-border h-11 w-11 shrink-0"
                      onClick={() => copyToClipboard(cred.value, cred.label)}
                    >
                      {copied === cred.label ? <Check className="h-4 w-4 text-safe" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning">⚠️ Account Status: Pending Verification. Save your credentials securely.</p>
              </div>
            </div>

            <Button onClick={() => navigate("/subscription")} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12">
              Choose Subscription Plan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompanyRegistration;
