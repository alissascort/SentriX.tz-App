import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, TrendingUp, TrendingDown, Shield, AlertTriangle,
  Monitor, BarChart3, Settings, Cpu, MemoryStick, HardDrive, Wifi
} from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";

const navItems = [
  { icon: Shield, label: "Dashboard", path: "/dashboard" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: Monitor, label: "Devices", path: "/devices" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", active: true },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Analytics = () => {
  const navigate = useNavigate();
  const { data, loading } = useMetrics(5000);

  const cpu = data?.cpu;
  const memory = data?.memory;
  const disk = data?.disk;
  const network = data?.network;
  const agent = data?.agent;

  const stats = [
    { label: "CPU Usage", value: `${cpu?.usage_percent?.toFixed(0) || "—"}%`, load: cpu?.load_avg_1m?.toFixed(1) || "—", icon: Cpu, color: "text-primary" },
    { label: "Memory Used", value: `${memory?.used_percent || "—"}%`, load: `${memory?.used_gb || "—"} GB`, icon: MemoryStick, color: "text-info" },
    { label: "Disk Used", value: `${disk?.used_percent || "—"}%`, load: `${disk?.free_gb || "—"} GB free`, icon: HardDrive, color: "text-warning" },
    { label: "Network", value: `${network?.connections || "—"} conn`, load: `${network?.recv_rate_kbps || "—"} KB/s ↓`, icon: Wifi, color: "text-safe" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg bg-card">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">{agent?.hostname || "Agent"} · v{agent?.version || "—"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-4">
        {loading && !data ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} className="card-sentrix p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className={`h-9 w-9 rounded-lg bg-muted/20 flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stat.load}</p>
                </motion.div>
              ))}
            </div>

            <motion.div className="card-sentrix p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Resource Distribution</h3>
              {[
                { label: "CPU", value: cpu?.usage_percent || 0, color: "bg-primary" },
                { label: "Memory", value: memory?.used_percent || 0, color: "bg-info" },
                { label: "Disk", value: disk?.used_percent || 0, color: "bg-warning" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-muted-foreground w-14">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${item.color}`} initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ delay: 0.5, duration: 0.6 }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-10 text-right">{item.value}%</span>
                </div>
              ))}
            </motion.div>

            <motion.div className="card-sentrix p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3 className="text-sm font-semibold text-foreground mb-3">Agent Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/20"><span className="text-muted-foreground">Hostname</span><span className="text-foreground font-medium">{agent?.hostname || "—"}</span></div>
                <div className="flex justify-between py-1.5 border-b border-border/20"><span className="text-muted-foreground">Platform</span><span className="text-foreground font-medium">{agent?.platform || "—"}</span></div>
                <div className="flex justify-between py-1.5 border-b border-border/20"><span className="text-muted-foreground">Version</span><span className="text-foreground font-medium">{agent?.version || "—"}</span></div>
                <div className="flex justify-between py-1.5 border-b border-border/20"><span className="text-muted-foreground">CPU Cores</span><span className="text-foreground font-medium">{cpu?.cores || "—"}</span></div>
                <div className="flex justify-between py-1.5 border-b border-border/20"><span className="text-muted-foreground">Health</span><span className="text-safe font-medium">{agent?.overall_health || "—"}%</span></div>
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Uptime</span><span className="text-foreground font-medium">{agent?.uptime_seconds ? `${Math.floor(agent.uptime_seconds / 3600)}h ${Math.floor((agent.uptime_seconds % 3600) / 60)}m` : "—"}</span></div>
              </div>
            </motion.div>
          </>
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

export default Analytics;
