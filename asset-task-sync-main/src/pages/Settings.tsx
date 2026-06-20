import { useState, useEffect } from 'react';
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
import { Bell, Mail, Shield, Palette, Database, Link, Copy, MessageCircle, ExternalLink, Check, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import laravelClient from '@/integrations/laravel/client';
import { useAuth } from '@/hooks/useAuth';

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

  // Telegram state
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showTelegramInstructions, setShowTelegramInstructions] = useState(false);

  const handleProfileSave = async () => {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile.',
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.current_password?.[0] ||
        "Failed to update password. Please check your current password.";

      toast({
        title: "Error",
        description: errorMessage,
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
  }, []);

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
          {role !== 'requester' && (
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
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color theme
                    </p>
                  </div>
                  <Select defaultValue="light" disabled>
                    <SelectTrigger className="w-[180px]">
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
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language
                    </p>
                  </div>
                  <Select defaultValue="en" disabled>
                    <SelectTrigger className="w-[180px]">
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
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label>Timezone</Label>
                    <p className="text-sm text-muted-foreground">
                      Set your local timezone
                    </p>
                  </div>
                  <Select defaultValue="utc" disabled>
                    <SelectTrigger className="w-[220px]">
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

            {role === 'admin' && (
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
                  Receive instant notifications via Telegram when your account is approved
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
                      You'll receive approval notifications and updates directly in Telegram.
                    </p>
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
                        <li>Click "Link Telegram Account" button below</li>
                        <li>Open the generated link in Telegram</li>
                        <li>Press "Start" or send /start to the bot</li>
                        <li>You'll receive a confirmation message</li>
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
                            Your Telegram Link:
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={telegramDeepLink || ''}
                              readOnly
                              className="text-xs font-mono"
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
                        </div>
                        <a
                          href={telegramDeepLink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button variant="accent" className="w-full gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Open in Telegram
                          </Button>
                        </a>
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
                    Configure default maintenance parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">System maintenance settings are coming soon.</p>
                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <Label>Default Reminder Time</Label>
                      <p className="text-sm text-muted-foreground">
                        How early to send ticket reminders
                      </p>
                    </div>
                    <Select defaultValue="24" disabled>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="24">24 hours before</SelectItem>
                        <SelectItem value="48">48 hours before</SelectItem>
                        <SelectItem value="168">1 week before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between opacity-50">
                    <div className="space-y-0.5">
                      <Label>Auto-archive Completed Tickets</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically archive tickets after completion
                      </p>
                    </div>
                    <Select defaultValue="30" disabled>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">After 7 days</SelectItem>
                        <SelectItem value="30">After 30 days</SelectItem>
                        <SelectItem value="90">After 90 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <p className="text-sm text-muted-foreground">Data export and log management are coming soon.</p>
                  <Button variant="outline" disabled>Export All Data</Button>
                  <Button variant="destructive" disabled>Clear Activity Logs</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
