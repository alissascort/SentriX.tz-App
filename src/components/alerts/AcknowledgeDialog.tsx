import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, User, Clock } from "lucide-react";
import { toast } from "sonner";
import AlertMetaBadges from "./AlertMetaBadges";
import AuditLogPreview from "./AuditLogPreview";

interface AcknowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: {
    id: number;
    level: string;
    device: string;
    attack: string;
    ip: string;
    description: string;
    time: string;
  };
}

const statusOptions = [
  { value: "monitoring", label: "Monitoring" },
  { value: "investigating", label: "Investigating" },
  { value: "false_positive", label: "False Positive" },
  { value: "mitigated", label: "Mitigated" },
];

const AcknowledgeDialog = ({ open, onOpenChange, alert }: AcknowledgeDialogProps) => {
  const [status, setStatus] = useState("monitoring");
  const [notes, setNotes] = useState("");
  const [analyst, setAnalyst] = useState("SecurityAdmin");
  const alertId = `SX-2026-${String(alert.id).padStart(4, "0")}`;

  const handleConfirm = () => {
    toast.success(`Alert ${alertId} acknowledged`, {
      description: `Status: ${statusOptions.find((s) => s.value === status)?.label} — Audit log recorded`,
    });
    onOpenChange(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-safe/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-safe">
            <CheckCircle2 className="h-5 w-5" /> Acknowledge Security Alert
          </DialogTitle>
          <DialogDescription>Record your review and set the response status.</DialogDescription>
        </DialogHeader>

        <AlertMetaBadges alertId={alertId} severity={alert.level} system={alert.device} time={alert.time} />

        {/* Alert Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Alert Details</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
            <span className="text-muted-foreground">Alert ID</span><span className="text-foreground">{alertId}</span>
            <span className="text-muted-foreground">System</span><span className="text-foreground">{alert.device}</span>
            <span className="text-muted-foreground">Threat Type</span><span className="text-foreground">{alert.attack}</span>
            <span className="text-muted-foreground">Severity</span><span className="text-destructive font-semibold">{alert.level}</span>
            <span className="text-muted-foreground">Detected</span><span className="text-foreground">{alert.time}</span>
            <span className="text-muted-foreground">Source IP</span><span className="text-foreground font-mono">{alert.ip}</span>
          </div>
        </div>

        {/* Response Status */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Response Status</h4>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  status === opt.value
                    ? "border-safe/50 bg-safe/10 text-safe"
                    : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Analyst Notes</h4>
          <Textarea
            placeholder="Alert reviewed. IP blocked and system isolated. Monitoring for further activity."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs min-h-[70px] bg-muted/20"
          />
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Assignment</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Analyst</label>
              <Input value={analyst} onChange={(e) => setAnalyst(e.target.value)} className="text-xs h-8 bg-muted/20" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Timestamp</label>
              <Input
                readOnly
                value={new Date().toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" })}
                className="text-xs h-8 bg-muted/20 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <AuditLogPreview action="Alert Acknowledged" alertId={alertId} target={alert.device} operator={analyst} />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 bg-safe text-safe-foreground hover:bg-safe/90" onClick={handleConfirm}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Confirm Acknowledgement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcknowledgeDialog;
