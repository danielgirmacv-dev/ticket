import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  Shield,
  Palette,
  Database,
  Link,
  Copy,
  MessageCircle,
  ExternalLink,
  Check,
  User,
  Download,
  Trash2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import laravelClient from '@/integrations/laravel/client';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api-error';

const Settings = () => {
  const { toast } = useToast();
  const { role, profile, user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return localStorage.getItem('session_timeout_minutes') || '60';
  });

  const handleSessionTimeoutChange = (val: string) => {
    setSessionTimeout(val);
    localStorage.setItem('session_timeout_minutes', val);
    toast({
      title: 'Session Timeout Updated',
      description: val === 'disabled'
        ? 'Automatic session timeout has been disabled.'
        : `Inactivity timeout set to ${val} minutes.`,
    });
  };

  // Telegram state
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showTelegramInstructions, setShowTelegramInstructions] = useState(false);

  // System settings state (super admin only)
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  const REMINDER_OPTIONS = [
    { value: '1', label: '1 hour before' },
    { value: '24', label: '24 hours before' },
    { value: '48', label: '48 hours before' },
    { value: '168', label: '1 week before' },
  ];

  const ARCHIVE_OPTIONS = [
    { value: '7', label: 'After 7 days' },
    { value: '30', label: 'After 30 days' },
    { value: '90', label: 'After 90 days' },
    { value: 'never', label: 'Never' },
  ];

  const isSuperAdmin = role === 'super_admin';

  // Fetch system settings
  const fetchSettings = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingSettings(true);
    try {
      const response = await laravelClient.get('/settings');
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [isSuperAdmin]);

  // Save system settings
  const saveSettings = async (key: string, value: string) => {
    if (!isSuperAdmin) return;
    setIsSavingSettings(true);
    try {
      const response = await laravelClient.patch('/settings', { [key]: value });
      setSettings(response.data.settings || {});
      toast({
        title: 'Setting Saved',
        description: 'System setting updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to save setting.'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  }, [isSuperAdmin]);

  // Export CSV
  const handleExport = async (type: 'tickets' | 'assets') => {
    if (!isSuperAdmin) return;
    setIsExporting(true);
    try {
      const response = await laravelClient.get(`/settings/export/${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `maintenance-${type}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Export Complete',
        description: `${type} data exported successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: getApiErrorMessage(error, 'Failed to export data.'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Clear activity logs
  const handleClearLogs = async () => {
    if (!isSuperAdmin) return;
    if (!window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) return;
    setIsClearingLogs(true);
    try {
      const response = await laravelClient.delete('/settings/logs');
      toast({
        title: 'Logs Cleared',
        description: response.data.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to clear logs.'),
        variant: 'destructive',
      });
    } finally {
      setIsClearingLogs(false);
    }
  };

  // Fetch Telegram status on mount
  const fetchTelegramStatus = async () => {
    if (!profile) return;
    setIsSavingProfile(true);
    try {
      await laravelClient.put(`/profiles/${profile.id}`, {
        name: profileName,
        department: profileDepartment,
      });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to update profile.'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await laravelClient.post('/user/update-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: getApiErrorMessage(error, "Failed to update password. Please check your current password."),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Fetch Telegram status on mount
  const fetchTelegramStatus = async () => {
    try {
      const response = await laravelClient.get('/telegram/status');
      setTelegramLinked(response.data.linked);
      setTelegramUsername(response.data.username);
    } catch (error) {
      console.error('Failed to fetch Telegram status:', error);
    }
  };

  // Generate Telegram link
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await laravelClient.post('/telegram/generate-link');
      setTelegramDeepLink(response.data.data.deep_link);
      setShowTelegramInstructions(true);

      toast({
        title: "Link Generated",
        description: "Click the link below to connect your Telegram account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Telegram link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Unlink Telegram
  const handleUnlinkTelegram = async () => {
    setIsUnlinking(true);
    try {
      await laravelClient.delete('/telegram/unlink');
      setTelegramLinked(false);
      setTelegramUsername(null);
      setTelegramDeepLink(null);
      setShowTelegramInstructions(false);

      toast({
        title: "Telegram Unlinked",
        description: "Your Telegram account has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlink Telegram account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    if (telegramDeepLink) {
      navigator.clipboard.writeText(telegramDeepLink);
      toast({
        title: "Link Copied",
        description: "The Telegram link has been copied to your clipboard.",
      });
    }
  };

  // Load Telegram status on component mount
  useEffect(() => {
    fetchTelegramStatus();
    if (isSuperAdmin) {
      fetchSettings();
    }
  }, [isSuperAdmin, fetchSettings, fetchTelegramStatus]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfileDepartment(profile.department || '');
    }
  }, [profile]);

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your application preferences"
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Palette className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          {role === 'super_admin' && (
            <TabsTrigger value="system" className="gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="profileName">Full Name</Label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profileEmail">Email</Label>
                  <Input id="profileEmail" type="email" value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Contact an admin to change your email address.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profileDepartment">Department</Label>
                  <Input
                    id="profileDepartment"
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    placeholder="e.g., IT, Facilities"
                  />
                </div>
                <Button variant="accent" onClick={handleProfileSave} disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">Theme, language, and timezone preferences are coming soon.</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-50">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <Select defaultValue="light" disabled>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-50">
                  <div className="space-y-0.5">
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language
                    </p>
                  </div>
                  <Select defaultValue="en" disabled>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-50">
                  <div className="space-y-0.5">
                    <Label>Timezone</Label>
                    <p className="text-sm text-muted-foreground">
                      Set your local timezone
                    </p>
                  </div>
                  <Select defaultValue="utc" disabled>
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                      <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
                      <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
                      <SelectItem value="cet">Central European (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {(role === 'admin' || role === 'super_admin') && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>
                  Organization-wide settings (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 opacity-50">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" defaultValue="Acme Corporation" disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orgEmail">Support Email</Label>
                  <Input id="orgEmail" type="email" defaultValue="it-support@acme.com" disabled />
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">Email and push notification preferences are coming soon. Use Telegram below for instant alerts.</p>
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    disabled
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive in-app push notifications
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Telegram Notifications
                </CardTitle>
                <CardDescription>
                  Receive instant Telegram messages for ticket lifecycle events — submission, approval, rejection, and technician assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {telegramLinked ? (
                  // Linked state
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Telegram Connected
                        </p>
                        {telegramUsername && (
                          <p className="text-xs text-green-700 dark:text-green-300">
                            @{telegramUsername}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You'll receive Telegram messages for these events:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-1">
                      <li>📋 New ticket submitted (manager notified)</li>
                      <li>✅ Ticket approved (requester notified)</li>
                      <li>❌ Ticket rejected (requester notified)</li>
                      <li>🔧 Technician assigned (technician &amp; requester notified)</li>
                    </ul>
                    <Button
                      variant="outline"
                      onClick={handleUnlinkTelegram}
                      disabled={isUnlinking}
                      className="w-full"
                    >
                      {isUnlinking ? 'Unlinking...' : 'Unlink Telegram Account'}
                    </Button>
                  </div>
                ) : (
                  // Unlinked state
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <p className="text-sm font-medium">How to connect:</p>
                      <ol className="text-sm text-muted-foreground space-y-2 pl-5 list-decimal">
                        <li>
                          Click <strong>"Link Telegram Account"</strong> below to get your code
                        </li>
                        <li>
                          Open the <strong>Telegram app</strong> (desktop or mobile) and search for
                          your bot
                        </li>
                        <li>
                          Send <strong>/start &lt;token&gt;</strong> to the bot
                        </li>
                        <li>
                          You'll receive a confirmation message — you're connected
                        </li>
                      </ol>
                    </div>

                    {!showTelegramInstructions ? (
                      <Button
                        variant="accent"
                        onClick={handleGenerateLink}
                        disabled={isGeneratingLink}
                        className="w-full gap-2"
                      >
                        <Link className="h-4 w-4" />
                        {isGeneratingLink ? 'Generating...' : 'Link Telegram Account'}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Your Telegram Link Code:
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={telegramDeepLink || ''}
                              readOnly
                              className="text-xs font-mono flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCopyLink}
                              className="shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Copy this link, then open the Telegram app (desktop or mobile) and paste
                            it — or send <code className="font-mono">/start &lt;token&gt;</code> to the
                            bot manually using the code after <code className="font-mono">?start=</code>.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (telegramDeepLink) window.open(telegramDeepLink, '_blank');
                            }}
                          >
                            Open Link in New Tab
                          </Button>
                          <Button variant="accent" size="sm">
                            <ExternalLink className="h-4 w-4" />
                            Desktop App
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Link expires in 15 minutes
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  variant="accent"
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Two-factor authentication is not yet available.</p>
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Require a verification code when signing in
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Session Security & Auto-Logout
                </CardTitle>
                <CardDescription>
                  Automatically logs out your account after inactivity to protect against unauthorized access on unattended devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="font-semibold text-sm">Inactivity Timeout</Label>
                    <p className="text-xs text-muted-foreground">
                      Session ends and redirects to login when no mouse, keyboard, or touch events occur.
                    </p>
                  </div>
                  <Select value={sessionTimeout} onValueChange={handleSessionTimeoutChange}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">⏱️ 15 Minutes</SelectItem>
                      <SelectItem value="30">⏱️ 30 Minutes</SelectItem>
                      <SelectItem value="60">⏱️ 1 Hour (Recommended)</SelectItem>
                      <SelectItem value="120">⏱️ 2 Hours</SelectItem>
                      <SelectItem value="disabled">🚫 Disabled (Stay logged in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        {role !== 'requester' && (
          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Settings</CardTitle>
                  <CardDescription>
                    Configure default maintenance parameters (Super Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label>Default Reminder Time</Label>
                      <p className="text-sm text-muted-foreground">
                        How early to send ticket reminders
                      </p>
                    </div>
                    <Select
                      value={settings.reminder_time || '24'}
                      onValueChange={(val) => saveSettings('reminder_time', val)}
                      disabled={isSavingSettings || !isSuperAdmin}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSavingSettings && <span className="text-xs text-muted-foreground">Saving...</span>}
                  </div>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label>Auto-archive Completed Tickets</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically archive tickets after completion
                      </p>
                    </div>
                    <Select
                      value={settings.auto_archive_days || '30'}
                      onValueChange={(val) => saveSettings('auto_archive_days', val)}
                      disabled={isSavingSettings || !isSuperAdmin}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHIVE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSavingSettings && <span className="text-xs text-muted-foreground">Saving...</span>}
                  </div>
                  {!isSuperAdmin && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maintenance settings require Super Admin access.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Manage your application data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleExport('tickets')}
                      disabled={isExporting || !isSuperAdmin}
                      className="w-full"
                    >
                      {isExporting && <Download className="h-4 w-4 mr-2" />}
                      Export Tickets CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExport('assets')}
                      disabled={isExporting || !isSuperAdmin}
                      className="w-full"
                    >
                      {isExporting && <Download className="h-4 w-4 mr-2" />}
                      Export Assets CSV
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleClearLogs}
                    disabled={isClearingLogs || !isSuperAdmin}
                    className="w-full"
                  >
                    {isClearingLogs && <AlertTriangle className="h-4 w-4 mr-2" />}
                    Clear Activity Logs
                  </Button>
                  {!isSuperAdmin && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Data management requires Super Admin access.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
