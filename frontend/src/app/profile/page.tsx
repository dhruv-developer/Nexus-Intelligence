'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Shield, 
  LogOut, 
  Save,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // TODO: Implement profile update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsEditing(false);
    } catch (error: any) {
      setErrors({ general: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // TODO: Implement password change API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      setErrors({ general: 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    return colors[status as keyof typeof colors] || colors.trial;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
            {isEditing && (
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </h2>
              
              {errors.general && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    />
                  ) : (
                    <p className="text-foreground">{user.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{user.email}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Account Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionBadge(user.subscription_status)}`}>
                      {user.subscription_status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {user.is_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Member Since
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                {user.last_login_at && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Last Login
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{formatDate(user.last_login_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn-secondary"
                  >
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          className="w-full p-2 pr-10 border border-input rounded-md bg-background"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className="w-full p-2 pr-10 border border-input rounded-md bg-background"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          className="w-full p-2 pr-10 border border-input rounded-md bg-background"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirm_password && (
                        <p className="text-sm text-destructive mt-1">{errors.confirm_password}</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading}
                        className="btn-primary"
                      >
                        {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            current_password: '',
                            new_password: '',
                            confirm_password: ''
                          });
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full btn-secondary text-left justify-start">
                  <Settings className="w-4 h-4 mr-2 inline" />
                  Account Settings
                </button>
                <button className="w-full btn-secondary text-left justify-start">
                  <Shield className="w-4 h-4 mr-2 inline" />
                  Privacy Settings
                </button>
                <button className="w-full btn-secondary text-left justify-start">
                  <User className="w-4 h-4 mr-2 inline" />
                  Notification Preferences
                </button>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription</h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getSubscriptionBadge(user.subscription_status)}`}>
                    {user.plan} Plan
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.subscription_status === 'trial' && 'Upgrade to unlock all features'}
                    {user.subscription_status === 'active' && 'Your subscription is active'}
                    {user.subscription_status === 'expired' && 'Your subscription has expired'}
                  </p>
                </div>
                {user.subscription_status !== 'active' && (
                  <button className="w-full btn-primary">
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>

            {/* Logout */}
            <div className="bg-card rounded-lg border p-6">
              <button
                onClick={handleLogout}
                className="w-full btn-destructive flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
