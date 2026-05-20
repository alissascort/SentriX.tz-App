import { useState, useEffect } from "react";
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, AlertTriangle, Monitor, Wifi, Bell,
  ChevronRight, TrendingUp, Zap, LogOut, Cpu, HardDrive, MemoryStick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/hooks/useMetrics";

const API_BASE = 'http://192.168.1.15:3000';

const navItems = [
  { icon: Shield, label: "Dashboard", path: "/dashboard", active: true },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: Monitor, label: "Devices", path: "/devices" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
    case "warning": return "text-warning bg-warning/10 border-warning/20";
    default: return "text-safe bg-safe/10 border-safe/20";
  }
};

const formatTimeAgo = (dateStr: string): string => {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data, loading } = useMetrics(5000);

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/notifications?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const notifData = await response.json();
      if (notifData.status === 'success') {
        setNotifications(notifData.data?.notifications || notifData.data || []);
        setUnreadCount(notifData.data?.unread_count || notifData.unread_count || 0);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);

  // Socket.io real-time connection
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const socket = io("http://192.168.1.15:3000", { auth: { token } });
      socket.on("connect", () => console.log("[Socket] Connected"));
      socket.on("notification:new", (data: any) => {
        setNotifications(prev => [data, ...prev].slice(0, 5));
        setUnreadCount(prev => prev + 1);
      });
      socket.on("alert:new", () => fetchNotifications());
      socket.on("disconnect", () => console.log("[Socket] Disconnected"));
      return () => { socket.disconnect(); };
    } catch (e) {}
  }, []);
  }, []);

  const handleNotificationClick = async (n: any) => {
    if (!n.is_read) {
      try {
        const token = getToken();
        await fetch(`${API_BASE}/api/notifications/${n.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(x => x.id === n.id ? {...x, is_read: true} : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setShowNotifications(false);
    if (n.data?.alert_id) navigate(`/alerts`);
    else if (n.data?.contract_id) navigate('/settings');
    else if (n.data?.report_id) navigate('/settings');
  };

  const markAllRead = async () => {
    try {
      const token = getToken();
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('sentrix_token');
    sessionStorage.removeItem('sentrix_token');
    navigate("/login");
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Shield className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const cpu = data?.cpu;
  const memory = data?.memory;
  const disk = data?.disk;
  const network = data?.network;
  const agent = data?.agent;
  const alerts = data?.alerts || [];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">SentriX</h1>
            <p className="text-xs text-muted-foreground">{agent?.hostname || 'Agent'} · {agent?.platform || 'Linux'}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative p-2 rounded-lg bg-card"
              >
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 card-sentrix p-0 overflow-hidden z-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((n: any) => (
                        <div 
                          key={n.id} 
                          className={`p-3 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-muted'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-muted-foreground mt-1">{formatTimeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-border">
                    <button 
                      onClick={() => { setShowNotifications(false); navigate('/settings'); }}
                      className="w-full text-center text-xs text-primary hover:underline py-1"
                    >
                      View all notifications in Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowLogout(true)} className="p-2 rounded-lg bg-card">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-4">
        {/* Health Score */}
        <motion.div className="card-sentrix p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">System Health</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-foreground">{agent?.overall_health || 0}%</span>
              </div>
            </div>
            <div className="h-16 w-16 rounded-full border-4 border-primary/30 flex items-center justify-center relative">
              <motion.svg className="absolute inset-0" viewBox="0 0 64 64" initial={{ rotate: -90 }} animate={{ rotate: 270 }} transition={{ duration: 1.5, ease: "easeInOut" }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(147,47%,55%)" strokeOpacity="0.15" strokeWidth="4" />
                <motion.circle cx="32" cy="32" r="28" fill="none" stroke="hsl(147,47%,55%)" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray="176" initial={{ strokeDashoffset: 176 }}
                  animate={{ strokeDashoffset: 176 - (176 * (agent?.overall_health || 0) / 100) }}
                  transition={{ duration: 1.5, ease: "easeInOut" }} />
              </motion.svg>
              <Shield className="h-6 w-6 text-primary relative z-10" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-safe">
            <TrendingUp className="h-3 w-3" />
            <span>Agent v{agent?.version || '—'}</span>
          </div>
        </motion.div>

        {/* Resource Gauges */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div className="card-sentrix p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3"><Cpu className="h-4 w-4 text-primary" /></div>
            <p className="text-2xl font-bold text-foreground">{cpu?.usage_percent?.toFixed(0) || '—'}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">CPU Usage</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cpu?.usage_percent || 0}%` }} />
            </div>
          </motion.div>
          <motion.div className="card-sentrix p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center mb-3"><MemoryStick className="h-4 w-4 text-info" /></div>
            <p className="text-2xl font-bold text-foreground">{memory?.used_percent || '—'}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Memory</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-info transition-all" style={{ width: `${memory?.used_percent || 0}%` }} />
            </div>
          </motion.div>
          <motion.div className="card-sentrix p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center mb-3"><HardDrive className="h-4 w-4 text-warning" /></div>
            <p className="text-2xl font-bold text-foreground">{disk?.used_percent || '—'}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Disk Used</p>
            <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${disk?.used_percent || 0}%` }} />
            </div>
          </motion.div>
          <motion.div className="card-sentrix p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="h-9 w-9 rounded-lg bg-safe/10 flex items-center justify-center mb-3"><Wifi className="h-4 w-4 text-safe" /></div>
            <p className="text-2xl font-bold text-foreground">{network?.connections || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connections</p>
            <p className="text-[10px] text-muted-foreground mt-1">{network?.recv_rate_kbps || '—'} ↓ · {network?.sent_rate_kbps || '—'} ↑ KB/s</p>
          </motion.div>
        </div>

        {/* Resource Breakdown */}
        <motion.div className="card-sentrix p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Resource Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "CPU", value: cpu?.usage_percent || 0, color: "bg-primary" },
              { label: "Memory", value: memory?.used_percent || 0, color: "bg-info" },
              { label: "Disk", value: disk?.used_percent || 0, color: "bg-warning" },
              { label: "Health", value: agent?.overall_health || 0, color: "bg-safe" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-14">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div className="card-sentrix p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Alerts</h3>
            <button onClick={() => navigate("/alerts")} className="text-xs text-primary flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
            ) : (
              alerts.slice(0, 5).map((alert, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/alerts")}>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold border ${getSeverityColor(alert.severity || 'info')}`}>
                    {(alert.severity || 'INFO').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <item.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogout && (
          <motion.div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogout(false)}>
            <motion.div className="card-sentrix p-6 w-full max-w-sm space-y-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center gap-2">
                <LogOut className="h-8 w-8 text-destructive" />
                <h3 className="text-lg font-bold text-foreground">Logout</h3>
                <p className="text-sm text-muted-foreground text-center">Are you sure you want to sign out of SentriX?</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-border" onClick={() => setShowLogout(false)}>Cancel</Button>
                <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleLogout}>Logout</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close notification dropdown when clicking outside */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default Dashboard;
