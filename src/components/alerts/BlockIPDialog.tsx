import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, Globe, Server, Shield, MapPin, Wifi } from "lucide-react";
import { toast } from "sonner";
import AlertMetaBadges from "./AlertMetaBadges";
import AuditLogPreview from "./AuditLogPreview";

interface BlockIPDialogProps {
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

const BlockIPDialog = ({ open, onOpenChange, alert }: BlockIPDialogProps) => {
  const [duration, setDuration] = useState<string>("24h");
  const [scope, setScope] = useState<string>("system");
  const alertId = `SX-2026-${String(alert.id).padStart(4, "0")}`;

  const handleConfirm = () => {
    toast.success(`IP ${alert.ip} blocked (${duration === "perm" ? "permanently" : duration})`, {
      description: `Alert ${alertId} — Audit log recorded`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" /> Block Suspicious IP Address
          </DialogTitle>
          <DialogDescription>Review threat details before blocking network traffic.</DialogDescription>
        </DialogHeader>

        <AlertMetaBadges alertId={alertId} severity={alert.level} system={alert.device} time={alert.time} />

        {/* Threat Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Threat Information</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
            <span className="text-muted-foreground">Alert ID</span><span className="text-foreground">{alertId}</span>
            <span className="text-muted-foreground">Source IP</span><span className="text-foreground font-mono">{alert.ip}</span>
            <span className="text-muted-foreground">Destination</span><span className="text-foreground">{alert.device}</span>
            <span className="text-muted-foreground">Threat Type</span><span className="text-foreground">{alert.attack}</span>
            <span className="text-muted-foreground">Severity</span><span className="text-destructive font-semibold">{alert.level}</span>
            <span className="text-muted-foreground">Detected</span><span className="text-foreground">{alert.time}</span>
          </div>
        </div>

        {/* Network Intelligence */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Network Intelligence</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
            <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
            <span className="text-foreground">Eastern Europe</span>
            <span className="text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3" /> ISP / ASN</span>
            <span className="text-foreground">AS48031</span>
            <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Malicious</span>
            <span className="text-destructive font-semibold">Yes — Known threat</span>
            <span className="text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3" /> Attempts</span>
            <span className="text-foreground">347 in last hour</span>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Block Duration</h4>
          <div className="flex gap-2">
            {[
              { value: "1h", label: "1 Hour" },
              { value: "24h", label: "24 Hours" },
              { value: "perm", label: "Permanently" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  duration === opt.value
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Apply To</h4>
          <div className="flex gap-2">
            {[
              { value: "system", label: "This System Only" },
              { value: "org", label: "Entire Network" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  scope === opt.value
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <AuditLogPreview action="Block IP" alertId={alertId} target={alert.ip} />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirm}>
            <Ban className="mr-1 h-4 w-4" /> Confirm Block
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockIPDialog;
