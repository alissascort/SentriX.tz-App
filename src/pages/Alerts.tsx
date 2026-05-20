import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, Shield, Monitor,
  ChevronDown, ChevronUp, BarChart3, Settings,
  CheckCircle2, XCircle, Flag, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/hooks/useMetrics";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

const getAlertStyle = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical": return { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", dot: "bg-destructive" };
    case "warning": return { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30", dot: "bg-warning" };
    default: return { text: "text-safe", bg: "bg-safe/10", border: "border-safe/30", dot: "bg-safe" };
  }
};

const navItems = [
  { icon: Shield, label: "Dashboard", path: "/dashboard" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts", active: true },
  { icon: Monitor, label: "Devices", path: "/devices" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Alerts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, loading } = useMetrics(5000);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [actingId, setActingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  const alerts = data?.alerts || [];
  const filtered = filter === "All" ? alerts : alerts.filter((a: any) => (a.severity || "info").toLowerCase() === filter.toLowerCase());

    const handleAlertAction = async (action: string, alert: any) => {
    setActingId(alert.title);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/alerts/create-from-agent`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          title: alert.title,
          description: alert.description,
          severity: alert.severity || 'warning',
          action_taken: action,
          source: 'agent',
          risk_score: alert.risk_score || 0,
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Success", description: `Alert ${action.replace(/-/g, ' ')} successfully.` });
      } else {
        toast({ title: "Error", description: data.message || "Action failed.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg bg-card">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Alerts</h1>
            <p className="text-xs text-muted-foreground">{alerts.length} alerts from agent</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {["All", "Critical", "Warning", "Info"].map((f) => {
          const style = f === "All" ? null : getAlertStyle(f);
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                isActive
                  ? style ? `${style.bg} ${style.text} ${style.border}` : "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-3 px-4">
        {loading && alerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 text-safe opacity-50" />
            <p className="text-sm">No alerts found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((alert: any, i: number) => {
              const style = getAlertStyle(alert.severity || "info");
              const isExpanded = expandedId === i;

              return (
                <motion.div
                  key={i}
                  className={`card-sentrix overflow-hidden border ${isExpanded ? style.border : "border-transparent"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <button onClick={() => setExpandedId(isExpanded ? null : i)} className="w-full p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${style.dot} animate-pulse`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase ${style.text}`}>{alert.severity || "INFO"}</span>
                          <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                          <p className="text-xs text-muted-foreground">Severity: <span className="text-foreground font-medium">{alert.severity || "Info"}</span></p>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-safe/30 text-safe hover:bg-safe/10"
                              onClick={(e) => { e.stopPropagation(); handleAlertAction('acknowledge', alert); }}
                              disabled={actingId === i}
                            >
                              {actingId === i ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-warning/30 text-warning hover:bg-warning/10"
                              onClick={(e) => { e.stopPropagation(); handleAlertAction('escalate', alert); }}
                              disabled={actingId === i}
                            >
                              <Flag className="h-3.5 w-3.5 mr-1" />
                              Escalate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleAlertAction('false-positive', alert); }}
                              disabled={actingId === i}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              False Positive
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-info/30 text-info hover:bg-info/10"
                              onClick={(e) => { e.stopPropagation(); handleAlertAction('resolve', alert); }}
                              disabled={actingId === i}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <item.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
