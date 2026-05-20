import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldOff, AlertTriangle, Monitor, Cpu, Network } from "lucide-react";
import { toast } from "sonner";
import AlertMetaBadges from "./AlertMetaBadges";
import AuditLogPreview from "./AuditLogPreview";

interface IsolateDialogProps {
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

const isolationOptions = [
  { id: "network", label: "Disconnect network access" },
  { id: "external", label: "Disable external communication" },
  { id: "quarantine", label: "Move to quarantine network" },
  { id: "processes", label: "Stop suspicious processes" },
];

const IsolateDialog = ({ open, onOpenChange, alert }: IsolateDialogProps) => {
  const [checked, setChecked] = useState<string[]>(["network", "external"]);
  const alertId = `SX-2026-${String(alert.id).padStart(4, "0")}`;

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const handleConfirm = () => {
    toast.success(`${alert.device} isolated`, {
      description: `${checked.length} isolation actions applied — Audit log recorded`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-warning/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <ShieldOff className="h-5 w-5" /> Isolate Compromised Device
          </DialogTitle>
          <DialogDescription>Quarantine the device to prevent lateral movement.</DialogDescription>
        </DialogHeader>

        <AlertMetaBadges alertId={alertId} severity={alert.level} system={alert.device} time={alert.time} />

        {/* Device Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Device Information</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
            <span className="text-muted-foreground flex items-center gap-1"><Monitor className="h-3 w-3" /> Device</span>
            <span className="text-foreground">{alert.device}</span>
            <span className="text-muted-foreground">Hostname</span>
            <span className="text-foreground font-mono">{alert.device.toLowerCase().replace(/\s/g, "-")}</span>
            <span className="text-muted-foreground flex items-center gap-1"><Network className="h-3 w-3" /> IP</span>
            <span className="text-foreground font-mono">{alert.ip}</span>
            <span className="text-muted-foreground flex items-center gap-1"><Cpu className="h-3 w-3" /> OS</span>
            <span className="text-foreground">Ubuntu 22.04 LTS</span>
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground">Production VLAN</span>
            <span className="text-muted-foreground">Last Activity</span>
            <span className="text-foreground">{alert.time}</span>
          </div>
        </div>

        {/* Threat Evidence */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Threat Evidence</h4>
          <div className="space-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
            {[
              { label: "Suspicious process detected", active: true },
              { label: "Unauthorized login attempt", active: alert.attack.includes("Brute") || alert.attack.includes("Credential") },
              { label: "Malware indicator", active: alert.level === "Critical" },
              { label: "Data exfiltration attempt", active: alert.attack.includes("Exfiltration") },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${item.active ? "bg-destructive animate-pulse" : "bg-muted-foreground/30"}`} />
                <span className={item.active ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Isolation Options */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Isolation Actions</h4>
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            {isolationOptions.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2.5 text-xs cursor-pointer">
                <Checkbox
                  checked={checked.includes(opt.id)}
                  onCheckedChange={() => toggle(opt.id)}
                />
                <span className="text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Impact Warning */}
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-warning leading-relaxed">
            This action will disconnect the device from the organization network. Users on this system may lose connectivity.
          </p>
        </div>

        <AuditLogPreview action="Isolate Device" alertId={alertId} target={alert.device} />

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleConfirm}>
            <ShieldOff className="mr-1 h-4 w-4" /> Isolate Device
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IsolateDialog;
