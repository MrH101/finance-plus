import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('appTitle')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('welcome', { name: user?.first_name || user?.username })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="sn">Shona</option>
              <option value="nd">Ndebele</option>
            </select>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
