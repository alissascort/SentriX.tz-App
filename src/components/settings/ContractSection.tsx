import { useState, useEffect } from "react";
import { FileText, Download, Upload, Loader2, AlertCircle, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE = 'http://192.168.1.15:3000';

interface ContractDoc {
  id?: number;
  name: string;
  status: string;
  file_name?: string;
  fileName?: string;
  downloadPath?: string;
  is_template?: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  expires_at?: string;
  resubmit_count?: number;
  max_resubmits?: number;
  termination_reason?: string;
  created_at?: string;
}

const statusStyles: Record<string, string> = {
  template: "text-muted-foreground bg-muted/20",
  active: "text-primary bg-primary/10",
  submitted: "text-blue-400 bg-blue-400/10",
  pending_review: "text-warning bg-warning/10",
  approved: "text-safe bg-safe/10",
  rejected: "text-destructive bg-destructive/10",
  resubmit: "text-orange-400 bg-orange-400/10",
  expired: "text-muted-foreground bg-muted/20",
  terminated: "text-destructive bg-destructive/10",
};

const statusIcons: Record<string, any> = {
  active: FileText,
  submitted: Upload,
  pending_review: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  resubmit: RefreshCw,
  expired: AlertCircle,
  terminated: XCircle,
};

const formatStatus = (status: string): string => {
  if (status === 'template') return 'Template';
  return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const templates: ContractDoc[] = [
  { name: "SentriX Service Agreement", status: "template", file_name: "SentriX_Service_Agreement.docx", is_template: true },
  { name: "SentriX Usage Policy", status: "template", file_name: "SentriX_Usage_Policy.docx", is_template: true },
  { name: "Data Protection Agreement", status: "template", file_name: "Data_Protection_Agreement.docx", is_template: true },
];

const ContractSection = () => {
  const { toast } = useToast();
  const [userContracts, setUserContracts] = useState<ContractDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expiringAlert, setExpiringAlert] = useState(false);

  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');

  const fetchContracts = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/contracts`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.status === 'success') setUserContracts(data.data || []);

      try {
        const expResponse = await fetch(`${API_BASE}/api/contracts/check/expiring`, { headers: { 'Authorization': `Bearer ${token}` } });
        const expData = await expResponse.json();
        if (expData.data?.expiring_soon?.length > 0) setExpiringAlert(true);
      } catch (e) {}
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

 const handleDownloadTemplate = (doc: ContractDoc) => {
    const link = document.createElement("a");
    link.href = `/documents/${doc.file_name}`;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: `${doc.file_name} is downloading.` });
};

  const handleDownloadUserContract = async (contract: ContractDoc) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/contracts/${contract.id}/download`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.file_name || `${contract.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: contract.file_name });
    } catch (err) {
      const token = getToken();
      window.open(`${API_BASE}/api/contracts/${contract.id}/download?token=${token}`, '_blank');
    }
  };

  const handleDelete = async (contractId: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/contracts/${contractId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: "Deleted", description: "Contract removed." });
        fetchContracts();
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete contract.", variant: "destructive" });
    }
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".odt,.pdf,.doc,.docx";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, ""));
        const response = await fetch(`${API_BASE}/api/contracts/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data = await response.json();
        if (data.status === 'success') {
          toast({ title: "Submitted for Review", description: "Your signed contract has been submitted." });
          fetchContracts();
        } else {
          toast({ title: "Upload Failed", description: data.message || "Please try again.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Network error during upload.", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const canUpload = (): boolean => {
    const blocking = userContracts.some(c => ['submitted', 'pending_review'].includes(c.status));
    return !blocking;
  };

  const isContractLocked = (contractName: string): boolean => {
    return userContracts.some(c => c.name === contractName && ['submitted', 'pending_review', 'approved', 'active'].includes(c.status));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Contract & Legal</h3>
      <p className="text-[10px] text-muted-foreground">Download official templates, sign and stamp them, then upload signed copies for HQ approval.</p>

      {expiringAlert && (
        <div className="card-sentrix p-3 border-warning/30 bg-warning/5 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          <p className="text-[10px] text-warning">Some contracts are expiring soon. Please renew them.</p>
        </div>
      )}

      <div className="card-sentrix p-3 space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground mb-2">Status Guide</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(statusStyles).map(([key, style]) => (
            <span key={key} className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${style}`}>{formatStatus(key)}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Official Templates</p>
        {templates.map(d => {
          const locked = isContractLocked(d.name);
          return (
            <div key={d.name} className="card-sentrix p-4 flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusStyles[d.status]}`}>{formatStatus(d.status)}</span>
                  <span className="text-[10px] text-muted-foreground">{d.file_name}</span>
                  {locked && <span className="text-[10px] text-safe">✓ Submitted</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDownloadTemplate(d)}><Download className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Your Submissions</p>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : userContracts.length === 0 ? (
          <div className="card-sentrix p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No contracts submitted yet.</p>
          </div>
        ) : (
          userContracts.map(d => {
            const StatusIcon = statusIcons[d.status] || FileText;
            return (
              <div key={d.id} className="card-sentrix p-4 flex items-center gap-3 mb-2">
                <StatusIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusStyles[d.status] || 'bg-muted/20 text-muted-foreground'}`}>{formatStatus(d.status)}</span>
                    {d.file_name && <span className="text-[10px] text-muted-foreground">{d.file_name}</span>}
                    {d.submitted_at && <span className="text-[10px] text-muted-foreground">Submitted: {formatDate(d.submitted_at)}</span>}
                    {d.expires_at && d.status === 'approved' && <span className="text-[10px] text-muted-foreground">Expires: {formatDate(d.expires_at)}</span>}
                    {d.resubmit_count > 0 && <span className="text-[10px] text-muted-foreground">Resubmits: {d.resubmit_count}/{d.max_resubmits || 3}</span>}
                  </div>
                  {d.status === 'rejected' && <p className="text-[10px] text-destructive mt-1">Rejected. Please fix issues and resubmit.</p>}
                  {d.status === 'resubmit' && <p className="text-[10px] text-warning mt-1">HQ did not respond in time.</p>}
                  {d.status === 'terminated' && d.termination_reason && <p className="text-[10px] text-destructive mt-1">Reason: {d.termination_reason}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadUserContract(d)}><Download className="h-4 w-4" /></Button>
                  {(d.status === 'submitted' || d.status === 'rejected' || d.status === 'resubmit') && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d.id!)}><XCircle className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Button variant="outline" className="w-full border-border text-xs h-10" onClick={handleUpload} disabled={uploading || !canUpload()}>
        {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
        {uploading ? "Uploading..." : !canUpload() ? "Submission in Progress..." : "Upload Signed Contract"}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
       Contracts are reviewed by SentriX HQ within 7 days. Ensure all documents are signed and stamped before uploading.
      </p>
    </div>
  );
};

export default ContractSection;
