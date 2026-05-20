import { Shield } from "lucide-react";

interface AuditLogPreviewProps {
  action: string;
  alertId: string;
  target: string;
  operator?: string;
}

const AuditLogPreview = ({ action, alertId, target, operator = "SecurityAdmin" }: AuditLogPreviewProps) => {
  const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Shield className="h-3 w-3" />
        Audit Log Preview
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Event:</span>
        <span className="text-foreground font-medium">{action}</span>
        <span className="text-muted-foreground">Alert ID:</span>
        <span className="text-foreground font-medium">{alertId}</span>
        <span className="text-muted-foreground">Target:</span>
        <span className="text-foreground font-medium">{target}</span>
        <span className="text-muted-foreground">Operator:</span>
        <span className="text-foreground font-medium">{operator}</span>
        <span className="text-muted-foreground">Timestamp:</span>
        <span className="text-foreground font-medium">{timestamp}</span>
      </div>
    </div>
  );
};

export default AuditLogPreview;
