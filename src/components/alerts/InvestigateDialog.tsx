import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Eye, FileSearch, Network, Activity, Clock, Server, Download, BarChart3, Bug, FileText } from "lucide-react";
import { toast } from "sonner";
import AlertMetaBadges from "./AlertMetaBadges";
import AuditLogPreview from "./AuditLogPreview";

interface InvestigateDialogProps {
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

const timelineEvents = [
  { time: "12:44:02", event: "Failed login attempt", severity: "medium" },
  { time: "12:44:07", event: "Repeated authentication attempts", severity: "high" },
  { time: "12:44:15", event: "Suspicious process execution", severity: "critical" },
  { time: "12:44:22", event: "Outbound connection detected", severity: "critical" },
];

const severityDot: Record<string, string> = {
  medium: "bg-secondary",
  high: "bg-warning",
  critical: "bg-destructive animate-pulse",
};

const InvestigateDialog = ({ open, onOpenChange, alert }: InvestigateDialogProps) => {
  const [tab, setTab] = useState("summary");
  const alertId = `SX-2026-${String(alert.id).padStart(4, "0")}`;

  const handleAction = (action: string) => {
    toast.success(`${action} initiated`, { description: `Alert ${alertId} — Audit log recorded` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Eye className="h-5 w-5" /> Security Investigation Panel
          </DialogTitle>
          <DialogDescription>Deep forensic analysis of the detected threat.</DialogDescription>
        </DialogHeader>

        <AlertMetaBadges alertId={alertId} severity={alert.level} system={alert.device} time={alert.time} />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-8">
            <TabsTrigger value="summary" className="text-[10px] px-1">Summary</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[10px] px-1">Timeline</TabsTrigger>
            <TabsTrigger value="system" className="text-[10px] px-1">System</TabsTrigger>
            <TabsTrigger value="files" className="text-[10px] px-1">Files</TabsTrigger>
            <TabsTrigger value="network" className="text-[10px] px-1">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-2 mt-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground">Alert ID</span><span className="text-foreground">{alertId}</span>
              <span className="text-muted-foreground">Threat Category</span><span className="text-foreground">{alert.attack}</span>
              <span className="text-muted-foreground">Severity</span><span className="text-destructive font-semibold">{alert.level}</span>
              <span className="text-muted-foreground">Detection Engine</span><span className="text-foreground">SentriX AI Engine v3.2</span>
              <span className="text-muted-foreground">Source IP</span><span className="text-foreground font-mono">{alert.ip}</span>
              <span className="text-muted-foreground">Target System</span><span className="text-foreground">{alert.device}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border border-border bg-muted/20 rounded-lg p-3">
              {alert.description}
            </p>
          </TabsContent>

          <TabsContent value="timeline" className="mt-3">
            <div className="space-y-0 rounded-lg border border-border bg-muted/20 p-3">
              {timelineEvents.map((evt, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-14 shrink-0 pt-0.5">{evt.time}</span>
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${severityDot[evt.severity]}`} />
                  <span className="text-xs text-foreground">{evt.event}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-3 space-y-2">
            {[
              { title: "Running Processes", icon: Activity, items: ["nginx (PID 1024)", "sshd (PID 892)", "unknown_bin (PID 3847) ⚠️"] },
              { title: "Open Ports", icon: Server, items: ["22 (SSH)", "80 (HTTP)", "443 (HTTPS)", "4444 (Suspicious)"] },
              { title: "Logged-in Users", icon: FileSearch, items: ["root — active 2m", "admin — idle 15m"] },
            ].map((section) => (
              <div key={section.title} className="rounded-lg border border-border bg-muted/20 p-3">
                <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <section.icon className="h-3 w-3 text-primary" /> {section.title}
                </h5>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item} className={`text-xs font-mono ${item.includes("⚠️") || item.includes("Suspicious") ? "text-destructive" : "text-muted-foreground"}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="files" className="mt-3 space-y-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Recently Modified</h5>
              {["/etc/passwd — modified 3 min ago", "/tmp/.hidden_script.sh — created 5 min ago ⚠️", "/var/log/auth.log — cleared ⚠️"].map((f) => (
                <p key={f} className={`text-xs font-mono ${f.includes("⚠️") ? "text-destructive" : "text-muted-foreground"}`}>{f}</p>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Integrity Changes</h5>
              <p className="text-xs text-destructive font-mono">/usr/bin/curl — hash mismatch ⚠️</p>
              <p className="text-xs text-muted-foreground font-mono">/etc/crontab — modified</p>
            </div>
          </TabsContent>

          <TabsContent value="network" className="mt-3 space-y-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">External Communications</h5>
              {["185.234.72.19:4444 — 2.4GB sent ⚠️", "91.215.85.10:443 — C2 beacon pattern ⚠️", "8.8.8.8:53 — DNS (normal)"].map((c) => (
                <p key={c} className={`text-xs font-mono ${c.includes("⚠️") ? "text-destructive" : "text-muted-foreground"}`}>{c}</p>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <h5 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Suspicious Domains</h5>
              <p className="text-xs text-destructive font-mono">malware-c2.darknet.xyz ⚠️</p>
              <p className="text-xs text-destructive font-mono">exfil-drop.onion.link ⚠️</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Investigation Tools */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Investigation Tools</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction("Malware scan")}>
              <Bug className="mr-1 h-3 w-3" /> Run Malware Scan
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction("Forensic export")}>
              <Download className="mr-1 h-3 w-3" /> Export Report
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction("Log capture")}>
              <FileText className="mr-1 h-3 w-3" /> Capture Logs
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => handleAction("Attack graph generation")}>
              <BarChart3 className="mr-1 h-3 w-3" /> Attack Graph
            </Button>
          </div>
        </div>

        <AuditLogPreview action="Investigation Opened" alertId={alertId} target={alert.device} />
      </DialogContent>
    </Dialog>
  );
};

export default InvestigateDialog;
