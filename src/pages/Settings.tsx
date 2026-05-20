import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, ShieldCheck, Key, Server, Bell, CreditCard, FileText,
  BarChart3, List, HelpCircle, Info, ChevronRight, ArrowLeft,
  Download, MessageSquare, LogOut, Loader2, Plus, X, Wallet, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import SentriXLogo from "@/components/SentriXLogo";
import UsersSection from "@/components/settings/UsersSection";
import SecuritySection from "@/components/settings/SecuritySection";
import ApiSection from "@/components/settings/ApiSection";
import SystemsSection from "@/components/settings/SystemsSection";
import ContractSection from "@/components/settings/ContractSection";
import BillingSection from "@/components/settings/BillingSection";
import { useMetrics } from "@/hooks/useMetrics";

const API_BASE = 'http://192.168.1.15:3000';

type Section = null | "company" | "users" | "security" | "api" | "systems" | "notifications" | "billing" | "contract" | "reports" | "logs" | "support" | "about";

const sectionList: { id: Section; icon: any; label: string; desc: string }[] = [
  { id: "company", icon: Building2, label: "Agent Info", desc: "Connected agent details" },
  { id: "users", icon: Users, label: "Organization Users", desc: "Manage staff access" },
  { id: "security", icon: ShieldCheck, label: "Security Settings", desc: "Protect your account" },
  { id: "api", icon: Key, label: "API Integration", desc: "View API credentials" },
  { id: "systems", icon: Server, label: "Connected Systems", desc: "Integrated systems" },
  { id: "notifications", icon: Bell, label: "Threat Notifications", desc: "Alert preferences" },
  { id: "billing", icon: CreditCard, label: "Billing & Subscription", desc: "Plan & payments" },
  { id: "contract", icon: FileText, label: "Contract & Legal", desc: "Agreements & docs" },
  { id: "reports", icon: BarChart3, label: "Security Reports", desc: "Download reports" },
  { id: "logs", icon: List, label: "System Logs", desc: "Audit trail" },
  { id: "support", icon: HelpCircle, label: "Support & Help", desc: "Get assistance" },
  { id: "about", icon: Info, label: "About SentriX", desc: "Platform info" },
];

// ─── Agent Info Section ───
const CompanySection = () => {
  const { data } = useMetrics(5000);
  const agent = data?.agent;
  const cpu = data?.cpu;
  const memory = data?.memory;
  const disk = data?.disk;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Agent Info</h3>
      <div className="card-sentrix p-4 space-y-3">
        {[
          { label: "Hostname", value: agent?.hostname || "—" },
          { label: "Platform", value: agent?.platform || "—" },
          { label: "Agent Version", value: agent?.version || "—" },
          { label: "CPU Cores", value: cpu?.cores || "—" },
          { label: "Memory Total", value: `${memory?.total_gb || "—"} GB` },
          { label: "Disk Total", value: `${disk?.total_gb || "—"} GB` },
          { label: "Health Score", value: `${agent?.overall_health || "—"}%` },
        ].map(f => (
          <div key={f.label} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <span className="text-xs text-foreground font-medium">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Notifications Section ───
const NotificationsSection = () => {
  const [settings, setSettings] = useState({
    notification_email: true,
    notification_push: true,
    notification_sms: false,
    notification_critical_only: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (d.data?.user) {
        const u = d.data.user;
        setSettings({
          notification_email: u.notification_email ?? true,
          notification_push: u.notification_push ?? true,
          notification_sms: u.notification_sms ?? false,
          notification_critical_only: u.notification_critical_only ?? false,
        });
      }
    })
    .catch(() => {});
  }, []);

  const toggle = async (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
    setSettings(newSettings);
    setSaving(true);
    try {
      const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
      await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {}
    setSaving(false);
  };
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sentrix_token") || sessionStorage.getItem("sentrix_token");
    setLoadingHistory(true);
    fetch(`${API_BASE}/api/notifications?limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setNotifHistory(d.data?.notifications || d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const formatNotifTime = (dateStr: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
      <div className="card-sentrix p-4 space-y-4">
        {[
          { label: "Push Notifications", key: "notification_push" },
          { label: "Email Alerts", key: "notification_email" },
          { label: "SMS Alerts", key: "notification_sms" },
          { label: "Critical Alerts Only", key: "notification_critical_only" },
        ].map(n => (
          <div key={n.key} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{n.label}</span>
            <Switch checked={settings[n.key as keyof typeof settings]} onCheckedChange={() => toggle(n.key)} disabled={saving} />
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-foreground mt-6">Notification History</h3>
      {loadingHistory ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : notifHistory.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No notifications yet</p>
      ) : (
        <div className="card-sentrix overflow-hidden">
          {notifHistory.slice(0, 15).map((n: any) => (
            <div key={n.id} className={`p-3 border-b border-border/30 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}>
              <div className="flex items-start gap-2">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-primary" : "bg-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{formatNotifTime(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// ─── Reports Section ───
const ReportsSection = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "security", format: "pdf", schedule: "one_time" });
  const { toast } = useToast();

  const getToken = () => localStorage.getItem("sentrix_token") || sessionStorage.getItem("sentrix_token");

  const fetchReports = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/reports`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.status === "success") { setReports(data.data?.reports || data.data || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    if (!form.name) { toast({ title: "Name Required", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.status === "success") {
        toast({ title: "Report Initiated" });
        setShowGenerate(false);
        setForm({ name: "", type: "security", format: "pdf", schedule: "one_time" });
        fetchReports();
      } else { toast({ title: "Error", description: data.message || "Failed", variant: "destructive" }); }
    } catch (err) { toast({ title: "Error", variant: "destructive" }); }
    finally { setGenerating(false); }
  };

  const handleDownload = async (report: any) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/reports/${report.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.name}.${report.format || "pdf"}`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) { toast({ title: "Error", description: "Download failed", variant: "destructive" }); }
  };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Security Reports</h3>
        <Button variant="outline" size="sm" onClick={() => setShowGenerate(!showGenerate)} className="border-border text-xs">
          {showGenerate ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showGenerate ? "Cancel" : "Generate Report"}
        </Button>
      </div>
      {showGenerate && (
        <div className="card-sentrix p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase">Report Name *</label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Monthly Security Report" className="h-9 text-xs bg-muted/20 border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="flex h-9 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-foreground">
                <option value="security">Security</option><option value="compliance">Compliance</option><option value="audit">Audit</option><option value="device">Device</option><option value="alert">Alert</option><option value="system">System</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">Format</label>
              <select value={form.format} onChange={e => setForm({...form, format: e.target.value})} className="flex h-9 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-foreground">
                <option value="pdf">PDF</option><option value="csv">CSV</option><option value="excel">Excel</option><option value="json">JSON</option>
              </select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full h-9 text-xs">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      )}
      {reports.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No reports generated yet</p>
      ) : (
        reports.map((r: any) => (
          <div key={r.id} className="card-sentrix p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="text-sm text-foreground">{r.name}</span>
                <p className="text-[10px] text-muted-foreground">{r.type} · {r.format?.toUpperCase()} · {r.status}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => handleDownload(r)}>
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </Button>
          </div>
        ))
      )}
    </div>
  );
};
// ─── Logs Section ───
const LogsSection = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
    fetch(`${API_BASE}/api/logs/audit?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => { setLogs(d.data?.audits || d.data || []); setLoading(false); })
    .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">System Logs</h3>
      <div className="card-sentrix overflow-hidden">
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-border/30 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span>User</span><span>Action</span><span className="text-right">Time</span>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          logs.map((l: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-2 p-3 border-b border-border/10 last:border-0 text-xs">
              <span className="text-foreground font-medium truncate">{l.user?.first_name || 'System'}</span>
              <span className="text-muted-foreground truncate">{l.action || l.event_type}</span>
              <span className="text-muted-foreground text-right">{l.created_at ? new Date(l.created_at).toLocaleTimeString() : '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Support Section ───
const SupportSection = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">Support & Help</h3>
    {[
      { icon: MessageSquare, label: "Documentation", desc: "Platform guides and API docs" },
      { icon: Key, label: "API Reference", desc: "Integration documentation" },
      { icon: MessageSquare, label: "Contact Support", desc: "Email: support@sentrix.com" },
    ].map(s => (
      <div key={s.label} className="card-sentrix p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className="h-4 w-4 text-primary" /></div>
        <div className="flex-1"><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    ))}
  </div>
);

// ─── About Section ───
const AboutSection = () => {
  const { data } = useMetrics(5000);
  const agent = data?.agent;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-4">
        <SentriXLogo size={48} animate={false} />
        <h3 className="text-lg font-bold text-foreground mt-3">SentriX</h3>
        <p className="text-xs text-muted-foreground">Cyber Security Platform</p>
      </div>
      <div className="card-sentrix p-4 space-y-3">
        {[
          { label: "App Version", value: "2.1.0" },
          { label: "Agent Version", value: agent?.version || "—" },
          { label: "API Version", value: "v1.0.0" },
          { label: "License", value: "Enterprise" },
          { label: "Hostname", value: agent?.hostname || "—" },
        ].map(i => (
          <div key={i.label} className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
            <span className="text-muted-foreground">{i.label}</span><span className="text-foreground font-medium">{i.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const sectionComponents: Record<string, React.FC> = {
  company: CompanySection,
  users: UsersSection,
  security: SecuritySection,
  api: ApiSection,
  systems: SystemsSection,
  notifications: NotificationsSection,
  billing: BillingSection,
  contract: ContractSection,
  reports: ReportsSection,
  logs: LogsSection,
  support: SupportSection,
  about: AboutSection,
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const ActiveComponent = activeSection ? sectionComponents[activeSection] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => activeSection ? setActiveSection(null) : navigate("/dashboard")} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {activeSection ? sectionList.find(s => s.id === activeSection)?.label : "Settings"}
            </h1>
          </div>
          <SentriXLogo size={32} animate={false} />
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {!activeSection ? (
          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {sectionList.map((s, i) => (
              <motion.div
                key={s.id}
                className="card-sentrix p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => setActiveSection(s.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className="h-4 w-4 text-primary" /></div>
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            ))}
            <motion.div className="mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 h-12" onClick={() => { localStorage.clear(); sessionStorage.clear(); navigate("/login"); }}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;
