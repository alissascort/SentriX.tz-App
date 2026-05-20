import { useState, useEffect } from "react";
import { Plus, X, RefreshCw, Eye, Edit2, Trash2, ChevronDown, ChevronUp, Search, Loader2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

interface ConnectedSystem {
  id: number;
  name: string;
  type: string;
  provider: string;
  api_endpoint: string;
  status: string;
  sync_frequency: string;
  last_sync: string;
  collecting: string[];
  created_at: string;
}

const emptyForm = { name: "", type: "", provider: "", api_endpoint: "", sync_frequency: "Every 5 min" };

const SystemsSection = () => {
  const { toast } = useToast();
  const [systems, setSystems] = useState<ConnectedSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  const fetchSystems = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/systems`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSystems(data.data?.systems || data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch systems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const systemTypes = ["All", ...Array.from(new Set(systems.map(s => s.type).filter(Boolean)))];

  const filteredSystems = systems.filter(s => {
    const matchesSearch = search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.provider?.toLowerCase().includes(search.toLowerCase()) || s.type?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || s.status === filterStatus;
    const matchesType = filterType === "All" || s.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateEditField = (key: string, value: string) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSystem = async () => {
    if (!form.name || !form.type) {
      toast({ title: "Missing Fields", description: "System name and type are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/systems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          provider: form.provider,
          api_endpoint: form.api_endpoint,
          sync_frequency: form.sync_frequency
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "System Added", description: `${form.name} has been connected.` });
        setShowForm(false);
        setForm(emptyForm);
        fetchSystems();
      } else {
        toast({ title: "Error", description: data.message || "Failed to add system.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add system.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSystem = async (systemId: number) => {
    if (!editForm.name) return;

    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/systems/${systemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "System Updated" });
        setEditingId(null);
        fetchSystems();
      } else {
        toast({ title: "Error", description: data.message || "Failed to update system.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update system.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSystem = async (systemId: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/systems/${systemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "System Removed" });
        fetchSystems();
      } else {
        toast({ title: "Error", description: data.message || "Failed to remove system.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove system.", variant: "destructive" });
    }
  };

  const startEdit = (system: ConnectedSystem) => {
    setEditingId(system.id);
    setEditForm({
      name: system.name,
      type: system.type,
      provider: system.provider || "",
      api_endpoint: system.api_endpoint || "",
      sync_frequency: system.sync_frequency || "Every 5 min",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-safe/10 text-safe';
      case 'warning': return 'bg-warning/10 text-warning';
      case 'disabled': return 'bg-muted/20 text-muted-foreground';
      case 'disconnected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
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
        <h3 className="text-sm font-semibold text-foreground">Connected Systems</h3>
        <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="border-border text-xs">
          {showForm ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showForm ? "Cancel" : "Add System"}
        </Button>
      </div>

      {/* Add System Form */}
      {showForm && (
        <div className="card-sentrix p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">System Name *</label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Main Server" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Type *</label>
              <Select value={form.type} onValueChange={v => updateField('type', v)}>
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Server">Server</SelectItem>
                  <SelectItem value="Firewall">Firewall</SelectItem>
                  <SelectItem value="Router">Router</SelectItem>
                  <SelectItem value="CCTV">CCTV</SelectItem>
                  <SelectItem value="IoT">IoT</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Application">Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Provider</label>
              <Input value={form.provider} onChange={e => updateField('provider', e.target.value)} placeholder="e.g. Dell, Cisco" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Sync Frequency</label>
              <Select value={form.sync_frequency} onValueChange={v => updateField('sync_frequency', v)}>
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Every 1 min">Every 1 min</SelectItem>
                  <SelectItem value="Every 5 min">Every 5 min</SelectItem>
                  <SelectItem value="Every 10 min">Every 10 min</SelectItem>
                  <SelectItem value="Every 15 min">Every 15 min</SelectItem>
                  <SelectItem value="Every 30 min">Every 30 min</SelectItem>
                  <SelectItem value="Every 1 hour">Every 1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">API Endpoint</label>
              <Input value={form.api_endpoint} onChange={e => updateField('api_endpoint', e.target.value)} placeholder="https://system.company.com/api" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
          </div>
          <Button onClick={handleAddSystem} disabled={saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            {saving ? "Adding..." : "Connect System"}
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search systems..." className="h-8 text-xs bg-muted/20 border-border pl-7" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-24 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
            <SelectItem value="Disconnected">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-24 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            {systemTypes.filter(t => t !== "All").map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Systems List */}
      <div className="space-y-2">
        {filteredSystems.length === 0 ? (
          <div className="card-sentrix p-8 text-center">
            <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">
              {systems.length === 0 ? "No systems connected yet." : "No systems match your filters."}
            </p>
          </div>
        ) : (
          filteredSystems.map(system => (
            <div key={system.id} className="card-sentrix overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === system.id ? null : system.id)}
                className="w-full p-4 text-left flex items-center gap-3"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getStatusColor(system.status)}`}>
                  <Server className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{system.name}</p>
                  <p className="text-[10px] text-muted-foreground">{system.type} • {system.provider || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(system.status)}`}>
                    {system.status || 'Unknown'}
                  </span>
                  {expandedId === system.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {expandedId === system.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  {editingId === system.id ? (
                    <div className="space-y-2">
                      <Input value={editForm.name} onChange={e => updateEditField('name', e.target.value)} placeholder="System Name" className="h-8 text-xs bg-muted/20 border-border" />
                      <Input value={editForm.provider} onChange={e => updateEditField('provider', e.target.value)} placeholder="Provider" className="h-8 text-xs bg-muted/20 border-border" />
                      <Input value={editForm.api_endpoint} onChange={e => updateEditField('api_endpoint', e.target.value)} placeholder="API Endpoint" className="h-8 text-xs bg-muted/20 border-border" />
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateSystem(system.id)} disabled={saving} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 text-xs">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Save
                        </Button>
                        <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="border-border h-7 text-xs">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Type</span><p className="text-foreground font-medium">{system.type || '—'}</p></div>
                        <div><span className="text-muted-foreground">Provider</span><p className="text-foreground font-medium">{system.provider || '—'}</p></div>
                        <div><span className="text-muted-foreground">API Endpoint</span><p className="text-foreground font-medium truncate">{system.api_endpoint || '—'}</p></div>
                        <div><span className="text-muted-foreground">Sync</span><p className="text-foreground font-medium">{system.sync_frequency || '—'}</p></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Last Sync</span><p className="text-foreground font-medium">{system.last_sync || 'Never'}</p></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button onClick={() => startEdit(system)} size="sm" variant="outline" className="border-border h-7 text-xs">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button onClick={() => handleDeleteSystem(system.id)} size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-7 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                        <Button size="sm" variant="outline" className="border-border h-7 text-xs">
                          <RefreshCw className="h-3 w-3 mr-1" /> Sync Now
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemsSection;
