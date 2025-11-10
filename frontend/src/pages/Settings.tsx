import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UserSettings {
  email: string;
  name: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    transactionAlerts: boolean;
    reportAlerts: boolean;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    email: 'user@example.com',
    name: 'John Doe',
    currency: 'USD',
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      push: false,
      transactionAlerts: true,
      reportAlerts: false,
    },
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserSettings] as any),
          [child]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call to save settings
      console.log('Saving settings:', settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Error updating settings');
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.notifications.email}
                    onChange={(e) => handleInputChange('notifications.email', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                    Email Notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={settings.notifications.push}
                    onChange={(e) => handleInputChange('notifications.push', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
                    Push Notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="transactionAlerts"
                    checked={settings.notifications.transactionAlerts}
                    onChange={(e) => handleInputChange('notifications.transactionAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="transactionAlerts" className="ml-2 block text-sm text-gray-900">
                    Transaction Alerts
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reportAlerts"
                    checked={settings.notifications.reportAlerts}
                    onChange={(e) => handleInputChange('notifications.reportAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reportAlerts" className="ml-2 block text-sm text-gray-900">
                    Report Alerts
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 