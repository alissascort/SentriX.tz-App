import { useState, useEffect } from "react";
import { Fingerprint, Smartphone, Lock, Monitor, Clock, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";


const API_BASE = 'http://192.168.1.15:3000';

const SecuritySection = () => {
  const { toast } = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");

  // Toggle states
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [deviceAuth, setDeviceAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  
  const getToken = () => localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
  
    // Load real toggle values from backend
  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (d.data?.user) {
        const u = d.data.user;
        setTwoFactorEnabled(u.two_factor_enabled ?? false);
        setLoginAlerts(u.login_alerts ?? true);
        setDeviceAuth(u.device_authorization ?? false);
        setSessionTimeout(u.session_timeout ?? true);
        setBiometricEnabled((u.webauthn_credentials || []).length > 0);
      }
    })
    .catch(() => {});
  }, []);

  
  const passwordChecks = [
    { label: "At least 8 characters", pass: newPw.length >= 8 },
    { label: "Contains uppercase letter", pass: /[A-Z]/.test(newPw) },
    { label: "Contains lowercase letter", pass: /[a-z]/.test(newPw) },
    { label: "Contains a number", pass: /\d/.test(newPw) },
    { label: "Contains special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPw) },
  ];

  const allPass = passwordChecks.every(c => c.pass) && newPw === confirmPw && currentPw.length > 0;

  const handleChangePassword = async () => {
    if (!allPass) return;
    setChanging(true);
    setError("");

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({ title: "Password Changed", description: "Your password has been updated successfully." });
        setShowChangePassword(false);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setError("");
      } else {
        setError(data.message || "Failed to change password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setChanging(false);
    }
  };

    const handleToggle = async (key: string, currentValue: boolean, setter: (v: boolean) => void, label: string) => {
    // Biometric requires WebAuthn flow
    if (key === 'biometric_enabled') {
      if (!currentValue) {
        try {
          const token = getToken();
          const challengeRes = await fetch(`${API_BASE}/api/auth/webauthn/register-challenge`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const challengeData = await challengeRes.json();

          if (challengeData.status !== 'success') {
            throw new Error('Failed to get challenge');
          }

          const credential = await navigator.credentials.create({
            publicKey: challengeData.data
          });

          const response = await fetch(`${API_BASE}/api/auth/webauthn/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(credential)
          });

          const data = await response.json();
          if (data.status === 'success') {
            setter(true);
            toast({ title: "Biometric Enabled", description: "You can now use fingerprint or face to login." });
          } else {
            toast({ title: "Failed", description: "Biometric registration failed.", variant: "destructive" });
          }
        } catch (err) {
          toast({ title: "Not Supported", description: "Biometric not available on this device.", variant: "destructive" });
        }
      } else {
        try {
          const token = getToken();
          await fetch(`${API_BASE}/api/auth/webauthn/remove`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setter(false);
          toast({ title: "Biometric Removed", description: "Fingerprint/Face login disabled." });
        } catch (err) {
          toast({ title: "Error", description: "Failed to remove biometric.", variant: "destructive" });
        }
      }
      return;
    }

    // Other toggles
    const newValue = !currentValue;
    setter(newValue);

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: newValue })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast({ title: newValue ? `${label} Enabled` : `${label} Disabled` });
      } else {
        setter(currentValue);
        toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
      }
    } catch (err) {
      setter(currentValue);
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Security Settings</h3>
      <div className="card-sentrix p-4 space-y-4">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Fingerprint className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-foreground">Biometric Login</p>
              <p className="text-[10px] text-muted-foreground">Fingerprint & Face ID</p>
            </div>
          </div>
          <Switch checked={biometricEnabled} onCheckedChange={(v) => handleToggle('biometric_enabled', biometricEnabled, setBiometricEnabled, 'Biometric Login')} />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-foreground">Two-Factor Auth (OTP)</p>
              <p className="text-[10px] text-muted-foreground">SMS or authenticator</p>
            </div>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={(v) => handleToggle('two_factor_enabled', twoFactorEnabled, setTwoFactorEnabled, 'Two-Factor Auth')} />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-foreground">Login Alerts</p>
              <p className="text-[10px] text-muted-foreground">Notify on new device login</p>
            </div>
          </div>
          <Switch checked={loginAlerts} onCheckedChange={(v) => handleToggle('login_alerts', loginAlerts, setLoginAlerts, 'Login Alerts')} />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-foreground">Device Authorization</p>
              <p className="text-[10px] text-muted-foreground">Approve new devices</p>
            </div>
          </div>
          <Switch checked={deviceAuth} onCheckedChange={(v) => handleToggle('device_authorization', deviceAuth, setDeviceAuth, 'Device Authorization')} />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-foreground">Session Timeout</p>
              <p className="text-[10px] text-muted-foreground">Auto-logout after 30 min</p>
            </div>
          </div>
          <Switch checked={sessionTimeout} onCheckedChange={(v) => handleToggle('session_timeout', sessionTimeout, setSessionTimeout, 'Session Timeout')} />
        </div>
      </div>

      {!showChangePassword ? (
        <Button
          variant="outline"
          className="w-full border-border text-foreground h-10"
          onClick={() => setShowChangePassword(true)}
        >
          <Lock className="h-4 w-4 mr-2" /> Change Password
        </Button>
      ) : (
        <div className="card-sentrix p-4 space-y-3 border-primary/30">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-primary">Change Password</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowChangePassword(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setError(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Password</label>
            <div className="relative mt-1">
              <Input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" className="h-9 text-xs bg-muted/10 border-border pr-9" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">New Password</label>
            <div className="relative mt-1">
              <Input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" className="h-9 text-xs bg-muted/10 border-border pr-9" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {newPw.length > 0 && (
            <div className="space-y-1 pl-1">
              {passwordChecks.map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.pass ? <Check className="h-3 w-3 text-safe" /> : <X className="h-3 w-3 text-destructive" />}
                  <span className={`text-[10px] ${c.pass ? "text-safe" : "text-muted-foreground"}`}>{c.label}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" className="h-9 text-xs mt-1 bg-muted/10 border-border" />
            {confirmPw.length > 0 && confirmPw !== newPw && (
              <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <p className="text-[10px] text-destructive">{error}</p>
          )}

          <Button className="w-full h-10 text-xs" disabled={!allPass || changing} onClick={handleChangePassword}>
            {changing ? "Updating..." : "Update Password"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SecuritySection;
