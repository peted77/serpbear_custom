import React from 'react';
import InputField from '../common/InputField';

type SearchConsoleSettingsProps = {
  settings: SettingsType;
  settingsError: null | {
    type: string;
    msg: string;
  };
  updateSettings: (key: keyof SettingsType, value: string) => void;
};

const SearchConsoleSettings = ({
  settings,
  settingsError,
  updateSettings,
}: SearchConsoleSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="settings__section__input mb-4 w-full">
        <InputField
          id="search_console_client_email"
          label="Search Console Client Email"
          placeholder="myapp@appspot.gserviceaccount.com"
          value={settings.search_console_client_email}
          onChange={(val: string) =>
            updateSettings('search_console_client_email', val)
          }
        />
        {settingsError?.type === 'client_email' && (
          <p className="text-red-500 text-sm mt-1">{settingsError.msg}</p>
        )}
      </div>

      <div className="settings__section__input mb-4 w-full">
        <label
          htmlFor="search_console_private_key"
          className="mb-2 font-semibold block text-sm text-gray-700 capitalize"
        >
          Search Console Private Key
        </label>
        <textarea
          id="search_console_private_key"
          className="w-full p-2 border border-gray-200 rounded text-xs focus:outline-none h-[100px] focus:border-blue-200"
          value={settings.search_console_private_key}
          placeholder="-----BEGIN PRIVATE KEY-----/ssssaswdkihad...."
          onChange={(e) =>
            updateSettings('search_console_private_key', e.target.value)
          }
        />
        {settingsError?.type === 'private_key' && (
          <p className="text-red-500 text-sm mt-1">{settingsError.msg}</p>
        )}
      </div>
    </div>
  );
};

export default SearchConsoleSettings;
