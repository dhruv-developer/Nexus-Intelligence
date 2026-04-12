'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Globe,
  Lock,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Save,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Download
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  // Use actual user data instead of hardcoded values
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    role: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    alerts: false,
    marketingEmails: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginNotifications: true,
    apiAccess: false
  });

  const handleSaveProfile = () => {
    // Simulate saving profile
    console.log('Saving profile:', profileData);
  };

  const handleSaveNotifications = () => {
    // Simulate saving notifications
    console.log('Saving notifications:', notificationSettings);
  };

  const handleSaveSecurity = () => {
    // Simulate saving security settings
    console.log('Saving security:', securitySettings);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-nexus-100 text-nexus-700 dark:bg-nexus-900 dark:text-nexus-300' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="input-field"
                        placeholder={user?.full_name || 'Enter your full name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder={user?.email || 'Enter your email'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                      <input
                        type="text"
                        value={profileData.role}
                        onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your role"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveProfile} className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Subscription Plan</div>
                        <div className="text-sm text-muted-foreground">{user?.plan || 'Free Plan'}</div>
                      </div>
                      <span className="px-3 py-1 bg-nexus-100 text-nexus-700 rounded-full text-sm font-medium">
                        {user?.subscription_status || 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Account Created</div>
                        <div className="text-sm text-muted-foreground">
                          {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">Email Verified</div>
                        <div className="text-sm text-muted-foreground">{user?.email || 'Not verified'}</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">Receive updates via email</div>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.emailNotifications ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Push Notifications</div>
                        <div className="text-sm text-muted-foreground">Receive browser push notifications</div>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.pushNotifications ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Weekly Reports</div>
                        <div className="text-sm text-muted-foreground">Get weekly summary reports</div>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, weeklyReports: !prev.weeklyReports }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.weeklyReports ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">System Alerts</div>
                        <div className="text-sm text-muted-foreground">Important system notifications</div>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, alerts: !prev.alerts }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.alerts ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.alerts ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Marketing Emails</div>
                        <div className="text-sm text-muted-foreground">Product updates and promotions</div>
                      </div>
                      <button
                        onClick={() => setNotificationSettings(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.marketingEmails ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveNotifications} className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Two-Factor Authentication</div>
                        <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.twoFactorAuth ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Session Timeout</div>
                        <div className="text-sm text-muted-foreground">Auto-logout after inactivity</div>
                      </div>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                        className="input-field w-20"
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Login Notifications</div>
                        <div className="text-sm text-muted-foreground">Get notified of new logins</div>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ ...prev, loginNotifications: !prev.loginNotifications }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.loginNotifications ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.loginNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">API Access</div>
                        <div className="text-sm text-muted-foreground">Allow API access to your account</div>
                      </div>
                      <button
                        onClick={() => setSecuritySettings(prev => ({ ...prev, apiAccess: !prev.apiAccess }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.apiAccess ? 'bg-nexus-500' : 'bg-muted'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securitySettings.apiAccess ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveSecurity} className="btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Password & Authentication</h3>
                  <div className="space-y-4">
                    <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                      <Key className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                    <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Manage 2FA Devices</span>
                    </button>
                    <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>View Active Sessions</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Theme Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Theme Selection</label>
                      <ThemeToggle />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Interface Density</label>
                      <select className="input-field">
                        <option>Comfortable</option>
                        <option>Compact</option>
                        <option>Spacious</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Font Size</label>
                      <select className="input-field">
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                        <option>Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Display Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Show Sidebar</div>
                        <div className="text-sm text-muted-foreground">Display navigation sidebar</div>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-nexus-500">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Animations</div>
                        <div className="text-sm text-muted-foreground">Enable interface animations</div>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-nexus-500">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Compact Mode</div>
                        <div className="text-sm text-muted-foreground">Reduce spacing between elements</div>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs would follow similar patterns */}
            {activeTab === 'data' && (
              <div className="dashboard-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Data & Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Database className="w-5 h-5 text-nexus-500" />
                      <div className="font-medium text-foreground">Data Export</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Download all your data in a portable format</p>
                    <button className="btn-secondary text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <div className="font-medium text-foreground">Delete Account</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all data</p>
                    <button className="btn-secondary text-sm text-destructive hover:text-destructive">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="dashboard-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Connected Services</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-foreground">Slack Integration</div>
                          <div className="text-sm text-muted-foreground">Connect to your Slack workspace</div>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">Connect</button>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium text-foreground">Email Integration</div>
                          <div className="text-sm text-muted-foreground">Send reports via email</div>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
