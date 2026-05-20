import { useState, useEffect } from "react";
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Monitor, Server, Cpu, Shield,
  AlertTriangle, ChevronDown, ChevronUp, BarChart3, Settings,
  HardDrive, Plus, Trash2, Wifi, Router, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online': return "bg-safe";
    case 'warning': return "bg-warning";
    case 'offline': return "bg-destructive";
    default: return "bg-muted";
  }
};

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'server': return Server;
    case 'router': return Router;
    case 'firewall': return Shield;
    case 'switch': return Wifi;
    default: return Monitor;
  }
};

const navItems = [
  { icon: Shield, label: "Dashboard", path: "/dashboard" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: Monitor, label: "Devices", path: "/devices", active: true },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface Device {
  id: number;
  name: string;
  type: string;
  ip_address: string;
  status: string;
  health_score: number;
  last_seen: string;
  location?: string;
  os?: string;
}

const emptyDevice = { name: '', type: 'server', ip_address: '', location: '', os: '' };

const Devices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyDevice);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  const fetchDevices = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setDevices(data.data?.devices || data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  // Socket.io - Real-time live device monitoring
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(API_BASE, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Devices] Live monitoring active');
    });

    // Backend pings devices every 60 seconds - updates status in real-time
    socket.on('device:status', (data: any) => {
      setDevices(prev => prev.map(d => 
        d.id === data.deviceId 
          ? { ...d, status: data.status, last_seen: data.timestamp || new Date().toISOString() }
          : d
      ));
    });

    // Real-time health updates from device agents
    socket.on('device:health_updated', (data: any) => {
      setDevices(prev => prev.map(d => 
        d.id === data.device_id 
          ? { 
              ...d, 
              status: data.health?.status || d.status,
              health_score: data.health?.risk_score || d.health_score,
              last_seen: data.timestamp || new Date().toISOString()
            }
          : d
      ));
    });

    // New device added (by any user in company)
    socket.on('device:created', (device: Device) => {
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
    });

    // Device updated (by any user in company)
    socket.on('device:updated', (updated: any) => {
      setDevices(prev => prev.map(d => 
        d.id === updated.id ? { ...d, ...updated, updated_at: new Date() } : d
      ));
    });

    // Device removed (by any user in company)
    socket.on('device:deleted', (data: any) => {
      setDevices(prev => prev.filter(d => d.id !== data.id));
    });

    socket.on('connect_error', (error) => {
      console.error('[Devices] Socket connection error:', error.message);
    });

    return () => { 
      socket.disconnect(); 
    };
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.ip_address) {
      toast({ title: "Missing Fields", description: "Name and IP address are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Device Added", description: `${form.name} has been added.` });
        setShowAdd(false);
        setForm(emptyDevice);
        fetchDevices();
      } else {
        toast({ title: "Error", description: data.message || "Failed to add device.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/devices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Device Removed" });
        fetchDevices();
      } else {
        toast({ title: "Error", description: data.message || "Failed to remove.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  const online = devices.filter(d => d.status === 'online').length;
  const offline = devices.filter(d => d.status === 'offline').length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg bg-card"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Devices</h1>
            <p className="text-xs text-muted-foreground">{devices.length} devices monitored</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)} className="border-border text-xs">
            {showAdd ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            {showAdd ? "Cancel" : "Add Device"}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3">
        <div className="flex-1 card-sentrix p-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-safe" />
          <span className="text-sm font-semibold text-foreground">{online}</span>
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
        <div className="flex-1 card-sentrix p-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span className="text-sm font-semibold text-foreground">{offline}</span>
          <span className="text-xs text-muted-foreground">Offline</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4">
        {/* Add Form */}
        {showAdd && (
          <div className="card-sentrix p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Web Server 01" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="flex h-9 w-full rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
                  <option value="server">Server</option>
                  <option value="workstation">Workstation</option>
                  <option value="firewall">Firewall</option>
                  <option value="router">Router</option>
                  <option value="switch">Switch</option>
                  <option value="cctv">CCTV</option>
                  <option value="iot">IoT</option>
                  <option value="mobile">Mobile</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase">IP Address *</label>
                <Input value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="192.168.1.10" className="h-9 text-xs" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full h-9 text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              {saving ? "Adding..." : "Add Device"}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : devices.length === 0 ? (
          <div className="card-sentrix p-8 text-center">
            <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No devices added yet.</p>
          </div>
        ) : (
          devices.map((device, i) => {
            const isExpanded = expandedId === device.id;
            const TypeIcon = getTypeIcon(device.type);
            return (
              <motion.div key={device.id} className="card-sentrix overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <button onClick={() => setExpandedId(isExpanded ? null : device.id)} className="w-full p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${getStatusColor(device.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.type} · {device.ip_address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${device.status === 'online' ? 'bg-safe/10 text-safe' : device.status === 'warning' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                        {device.status || 'Unknown'}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground">IP Address</span><p className="text-foreground font-medium">{device.ip_address}</p></div>
                      <div><span className="text-muted-foreground">Type</span><p className="text-foreground font-medium">{device.type}</p></div>
                      <div><span className="text-muted-foreground">Status</span><p className="text-foreground font-medium">{device.status}</p></div>
                      <div><span className="text-muted-foreground">Last Seen</span><p className="text-foreground font-medium">{device.last_seen || '—'}</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-7 text-xs w-full" onClick={() => handleDelete(device.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove Device
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })
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

export default Devices;
