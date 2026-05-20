import { useState, useEffect } from "react";
import { Eye, EyeOff, RotateCw, Globe, Wifi, Copy, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

const ApiSection = () => {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null);

  const [creds, setCreds] = useState([
    { label: "Client ID", value: "—" },
    { label: "API Key", value: "—" },
    { label: "Tenant ID", value: "—" },
    { label: "API Endpoint", value: `${API_BASE}/api/external` },
  ]);

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  // Fetch user data for Client ID, Tenant ID, and API keys
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        
        // Get user profile (has company info)
        const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meResponse.json();

        // Get API keys
        const keysResponse = await fetch(`${API_BASE}/api/users/api-keys`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const keysData = await keysResponse.json();

        const company = meData?.data?.user?.company;
        const apiKeys = keysData?.data || [];
        const activeKey = apiKeys.find((k: any) => !k.is_revoked);

        setCreds([
          { label: "Client ID", value: company?.client_id || "—" },
          { label: "API Key", value: activeKey?.api_key_preview || "No active key" },
          { label: "Tenant ID", value: company?.tenant_id || "—" },
          { label: "API Endpoint", value: `${API_BASE}/api` },
        ]);
      } catch (err) {
        console.error('Failed to fetch API data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveWebhook = () => {
    if (!webhookUrl.startsWith("http")) {
      toast({ title: "Invalid URL", description: "Webhook URL must start with http:// or https://", variant: "destructive" });
      return;
    }
    setWebhookSaved(true);
    toast({ title: "Webhook Saved", description: "Webhook URL has been configured." });
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Default API Key' })
      });

      const data = await response.json();

      if (data.status === 'success') {
        const newKey = data.data?.api_key || data.data?.key;
        setCreds(prev => prev.map(c => 
          c.label === "API Key" ? { ...c, value: newKey } : c
        ));
        toast({ title: "Key Regenerated", description: "Your new API key is shown above. Copy it now." });
        setShowSecrets(true);
      } else {
        toast({ title: "Error", description: data.message || "Failed to regenerate key.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to regenerate API key.", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setTestResult("success");
        toast({ title: "Connection Successful", description: "API is reachable and responding." });
      } else {
        setTestResult("failed");
        toast({ title: "Connection Failed", description: `Server returned ${response.status}.`, variant: "destructive" });
      }
    } catch (err) {
      setTestResult("failed");
      toast({ title: "Connection Failed", description: "Could not reach the API server.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">API Integration</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
          {showSecrets ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
          {showSecrets ? "Hide" : "Show"}
        </Button>
      </div>
      <div className="card-sentrix p-4 space-y-3">
        {creds.map(c => (
          <div key={c.label} className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            <div className="h-9 rounded-md bg-muted/20 border border-border px-3 flex items-center">
              <span className="text-xs text-foreground font-mono truncate flex-1">
                {showSecrets ? c.value : "••••••••••••••••"}
              </span>
             {showSecrets && c.value !== "—" && c.value !== "No active key" && (
                <button onClick={() => { navigator.clipboard.writeText(c.value); toast({ title: "Copied" }); }}>
                  <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Webhook URL */}
      <div className="card-sentrix p-4 space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Webhook URL</span>
        <p className="text-[10px] text-muted-foreground">Receive real-time event notifications (threats, alerts, system changes)</p>
        <div className="flex gap-2 mt-1">
          <Input
            value={webhookUrl}
            onChange={e => { setWebhookUrl(e.target.value); setWebhookSaved(false); }}
            placeholder="https://yourserver.com/webhook/sentrix"
            className="h-9 text-xs bg-muted/10 border-border flex-1"
          />
          <Button size="sm" className="h-9 text-xs px-3" onClick={handleSaveWebhook} disabled={!webhookUrl}>
            {webhookSaved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </div>

      <div className="card-sentrix p-4 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Integration Status</span>
        <span className={`text-xs font-medium flex items-center gap-1 ${testResult === "success" ? "text-safe" : testResult === "failed" ? "text-destructive" : "text-safe"}`}>
          <Wifi className="h-3 w-3" /> {testResult === "success" ? "Connected" : testResult === "failed" ? "Failed" : "Ready"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="border-border text-xs h-10" onClick={handleRegenerateKey} disabled={regenerating}>
          {regenerating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RotateCw className="h-3.5 w-3.5 mr-1" />}
          {regenerating ? "Generating..." : "Regenerate Key"}
        </Button>
        <Button variant="outline" className="border-border text-xs h-10" onClick={handleTestConnection} disabled={testing}>
          {testing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Globe className="h-3.5 w-3.5 mr-1" />}
          {testing ? "Testing..." : "Test Connection"}
        </Button>
      </div>
    </div>
  );
};

export default ApiSection;
