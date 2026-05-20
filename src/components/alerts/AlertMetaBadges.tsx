import { AlertTriangle, Clock, Monitor, Shield, User } from "lucide-react";

interface AlertMetaBadgesProps {
  alertId: string;
  severity: string;
  system: string;
  time: string;
  engine?: string;
  operator?: string;
}

const severityColor: Record<string, string> = {
  Critical: "text-destructive bg-destructive/10 border-destructive/30",
  High: "text-warning bg-warning/10 border-warning/30",
  Medium: "text-secondary bg-secondary/10 border-secondary/30",
  Low: "text-safe bg-safe/10 border-safe/30",
};

const AlertMetaBadges = ({
  alertId,
  severity,
  system,
  time,
  engine = "SentriX AI Engine",
  operator = "SecurityAdmin",
}: AlertMetaBadgesProps) => (
  <div className="flex flex-wrap gap-2 text-[10px]">
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
      <Shield className="h-3 w-3 text-primary" /> {alertId}
    </span>
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${severityColor[severity] || severityColor.Low}`}>
      <AlertTriangle className="h-3 w-3" /> {severity}
    </span>
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
      <Monitor className="h-3 w-3 text-secondary" /> {system}
    </span>
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
      <Clock className="h-3 w-3 text-muted-foreground" /> {time}
    </span>
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5">
      <User className="h-3 w-3 text-accent" /> {operator}
    </span>
  </div>
);

export default AlertMetaBadges;
