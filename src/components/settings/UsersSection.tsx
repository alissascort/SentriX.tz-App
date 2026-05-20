import { useState, useEffect } from "react";
import { Plus, ChevronRight, X, Send, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  department?: string;
  created_at: string;
}

interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  sendInvite: boolean;
}

const emptyUser: NewUser = {
  firstName: "", lastName: "", email: "", phone: "", role: "viewer",
  department: "", sendInvite: true,
};

const UsersSection = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>(emptyUser);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUsers(data.data?.users || data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch = search === "" || fullName.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "All" || u.role === filterRole;
    const matchesStatus = filterStatus === "All" || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.email || !newUser.role) {
      toast({ title: "Missing Fields", description: "First name, email, and role are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          department: newUser.department,
          send_invite: newUser.sendInvite
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "User Added", description: newUser.sendInvite ? "Invitation sent successfully." : "User created successfully." });
        setShowForm(false);
        setNewUser(emptyUser);
        fetchUsers(); // Refresh list
      } else {
        toast({ title: "Error", description: data.message || "Failed to add user.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add user. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "User Removed" });
        fetchUsers();
      } else {
        toast({ title: "Error", description: data.message || "Failed to remove user.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to remove user.", variant: "destructive" });
    }
  };

  const updateField = (key: keyof NewUser, value: any) => {
    setNewUser(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-safe/10 text-safe';
      case 'inactive': return 'bg-muted/20 text-muted-foreground';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'suspended': return 'bg-destructive/10 text-destructive';
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
        <h3 className="text-sm font-semibold text-foreground">Organization Users</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="border-border text-xs">
          {showForm ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="card-sentrix p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">First Name *</label>
              <Input value={newUser.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="John" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Name</label>
              <Input value={newUser.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="Doe" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Work Email *</label>
              <Input value={newUser.email} onChange={e => updateField('email', e.target.value)} type="email" placeholder="john@company.com" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</label>
              <Input value={newUser.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+255..." className="h-9 text-xs bg-muted/20 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Role *</label>
              <Select value={newUser.role} onValueChange={v => updateField('role', v)}>
                <SelectTrigger className="h-9 text-xs bg-muted/20 border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="security_analyst">Security Analyst</SelectItem>
                  <SelectItem value="it_officer">IT Officer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Department</label>
              <Input value={newUser.department} onChange={e => updateField('department', e.target.value)} placeholder="e.g. IT, Security, Operations" className="h-9 text-xs bg-muted/20 border-border" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Switch checked={newUser.sendInvite} onCheckedChange={v => updateField('sendInvite', v)} />
              <span className="text-xs text-muted-foreground">Send email invitation</span>
            </div>
            <Button onClick={handleAddUser} disabled={saving} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-xs">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
              {saving ? "Adding..." : "Add User"}
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="h-8 text-xs bg-muted/20 border-border pl-7" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="security_analyst">Analyst</SelectItem>
            <SelectItem value="it_officer">IT Officer</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-24 text-xs bg-muted/20 border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="card-sentrix overflow-hidden">
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-border/30 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          <span>User</span><span>Role</span><span>Status</span><span className="text-right">Actions</span>
        </div>
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {users.length === 0 ? "No users yet. Add your first team member." : "No users match your filters."}
          </p>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="grid grid-cols-4 gap-2 p-3 border-b border-border/10 last:border-0 text-xs items-center">
              <div>
                <span className="text-foreground font-medium">{user.first_name} {user.last_name}</span>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <span className="text-muted-foreground capitalize">{user.role?.replace('_', ' ') || '—'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium inline-block w-fit ${getStatusColor(user.status)}`}>
                {user.status || 'pending'}
              </span>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersSection;
