import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserSettings, Subscription } from '../types';
import api from '../utils/api';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, subRes] = await Promise.all([
        api.get('/settings'),
        api.get('/subscriptions/status')
      ]);
      setSettings(settingsRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert('Settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await api.post('/subscriptions/create-checkout');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      alert('Failed to start subscription process');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await api.post('/subscriptions/cancel');
      alert('Subscription canceled');
      loadData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/map')}
            className="text-blue-400 hover:text-blue-300 text-lg"
          >
            ← Back to Map
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <button
            onClick={logout}
            className="text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>

        {/* Subscription Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Subscription</h2>
          
          {subscription?.hasActiveSubscription ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-400 font-bold text-lg">✓ Premium Active</p>
                  <p className="text-sm text-gray-400">
                    Renews: {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <p className="font-semibold mb-2">Premium Benefits:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  <li>Unlimited alerts</li>
                  <li>Earlier alert distance (up to 1000m)</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-yellow-400 mb-4">Free Tier</p>
              <button
                onClick={handleSubscribe}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold w-full"
              >
                Upgrade to Premium - $9.99/month
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Get unlimited alerts and premium features
              </p>
            </div>
          )}
        </div>

        {/* Alert Settings */}
        {settings && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Alert Settings</h2>

            <div className="space-y-6">
              {/* Alert Distance */}
              <div>
                <label className="block text-lg font-medium mb-2">
                  Alert Distance: {settings.alertDistance}m
                </label>
                <select
                  value={settings.alertDistance}
                  onChange={(e) => setSettings({ ...settings, alertDistance: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-lg"
                >
                  <option value={300}>300m (Free)</option>
                  <option value={500} disabled={!subscription?.hasActiveSubscription}>
                    500m {!subscription?.hasActiveSubscription ? '(Premium)' : ''}
                  </option>
                  <option value={750} disabled={!subscription?.hasActiveSubscription}>
                    750m {!subscription?.hasActiveSubscription ? '(Premium)' : ''}
                  </option>
                  <option value={1000} disabled={!subscription?.hasActiveSubscription}>
                    1000m {!subscription?.hasActiveSubscription ? '(Premium)' : ''}
                  </option>
                </select>
              </div>

              {/* Alert Sound */}
              <div className="flex items-center justify-between">
                <label className="text-lg font-medium">Alert Sound</label>
                <button
                  onClick={() => setSettings({ ...settings, alertSound: !settings.alertSound })}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                    settings.alertSound ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                      settings.alertSound ? 'translate-x-11' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Speed Unit */}
              <div>
                <label className="block text-lg font-medium mb-2">Speed Unit</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSettings({ ...settings, speedUnit: 'MPH' })}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      settings.speedUnit === 'MPH'
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    MPH
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, speedUnit: 'KMH' })}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      settings.speedUnit === 'KMH'
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    KM/H
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mt-6 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Account</h2>
          <p className="text-gray-300">
            {user?.isGuest ? 'Guest Account' : user?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
