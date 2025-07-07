import React from 'react';
import { useClearFailedQueue } from '../../services/settings';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import SecretField from '../common/SecretField';
import ToggleField from '../common/ToggleField';

type ScraperSettingsProps = {
  settings: SettingsType;
  settingsError: null | {
    type: string;
    msg: string;
  };
  updateSettings: (key: keyof SettingsType, value: string | boolean) => void; // ✅ FIX: Replaced unsafe Function type with specific function signature
};

const ScraperSettings = ({ settings, settingsError, updateSettings }: ScraperSettingsProps) => {
  const { mutate: clearFailedMutate, isLoading: clearingQueue } = useClearFailedQueue(() => {});

  // ✅ FIX: Destructuring with defaults makes code cleaner and avoids repeating settings?.xyz
  const {
    scraper_type = 'none',
    scaping_api = '',
    scrape_interval = 'daily',
    scrape_delay = '0',
    scrape_retry = false,
    proxy = '',
    failed_queue = [],
    available_scapers = [],
  } = settings;

  // ✅ FIX: Use array fallback safely
  const scraperOptions: SelectionOption[] = [{ label: 'None', value: 'none' }, ...available_scapers];

  // ✅ FIX: Use readable condition for retry queue visibility
  const showClearQueue = scrape_retry && failed_queue.length > 0;

  const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700 capitalize';

  return (
    <div className="settings__content styled-scrollbar p-6 text-sm">
      <div className="settings__section__select mb-5">
        <SelectField
          label="Scraping Method"
          options={scraperOptions}
          selected={[scraper_type]}
          defaultLabel="Select Scraper"
          updateField={([val]) => updateSettings('scraper_type', val)} // ✅ FIX: Safer destructuring and typing
          multiple={false}
          rounded="rounded"
          minWidth={220}
        />
      </div>

      {scraper_type !== 'none' && scraper_type !== 'proxy' && (
        <div className="settings__section__secret mb-5">
          <SecretField
            label="Scraper API Key or Token"
            placeholder="API Key/Token"
            value={scaping_api}
            hasError={settingsError?.type === 'no_api_key'}
            onChange={(val) => updateSettings('scaping_api', val)}
          />
        </div>
      )}

      {scraper_type === 'proxy' && (
        <div className="settings__section__input mb-5">
          {/* ✅ FIX: Added htmlFor with corresponding id for accessibility */}
          <label htmlFor="proxy-list" className={labelStyle}>Proxy List</label>
          <textarea
            id="proxy-list"
            className={`w-full p-2 border rounded text-xs h-[160px] focus:outline-none focus:border-blue-200 
              ${settingsError?.type === 'no_proxy' ? 'border-red-400 focus:border-red-400' : 'border-gray-200'}`} // ✅ FIX: Error class now conditionally responds to correct error type
            value={proxy}
            placeholder={'http://122.123.22.45:5049\nhttps://user:password@122.123.22.45:5049'}
            onChange={(e) => updateSettings('proxy', e.target.value)}
          />
        </div>
      )}

      {scraper_type !== 'none' && (
        <div className="settings__section__input mb-5">
          <SelectField
            label="Scraping Frequency"
            multiple={false}
            selected={[scrape_interval]}
            options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Every Other Day', value: 'other_day' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Never', value: 'never' },
            ]}
            defaultLabel="Select Frequency" // ✅ FIX: Replaced confusing label "Notification Settings"
            updateField={([val]) => updateSettings('scrape_interval', val)}
            rounded="rounded"
            maxHeight={48}
            minWidth={220}
          />
          <small className="text-gray-500 pt-2 block">
            This option requires Server or Docker restart to take effect.
          </small>
        </div>
      )}

      <div className="settings__section__input mb-5">
        <SelectField
          label="Keyword Scrape Delay"
          multiple={false}
          selected={[scrape_delay]}
          options={[
            { label: 'No Delay', value: '0' },
            { label: '5 Seconds', value: '5000' },
            { label: '10 Seconds', value: '10000' },
            { label: '30 Seconds', value: '30000' },
            { label: '1 Minutes', value: '60000' },
            { label: '2 Minutes', value: '120000' },
            { label: '5 Minutes', value: '300000' },
            { label: '10 Minutes', value: '600000' },
            { label: '15 Minutes', value: '900000' },
            { label: '30 Minutes', value: '1800000' },
          ]}
          defaultLabel="Select Delay"
          updateField={([val]) => updateSettings('scrape_delay', val)}
          rounded="rounded"
          maxHeight={48}
          minWidth={220}
        />
        <small className="text-gray-500 pt-2 block">
          This option requires Server or Docker restart to take effect.
        </small>
      </div>

      <div className="settings__section__input mb-5">
        <ToggleField
          label="Auto Retry Failed Keyword Scrape"
          value={scrape_retry}
          onChange={(val) => updateSettings('scrape_retry', val)} // ✅ FIX: No coercion, typed boolean directly
        />
      </div>

      {showClearQueue && (
        <div className="settings__section__input mb-5">
          <label className={labelStyle}>Clear Failed Retry Queue</label>
          <button
            onClick={() => clearFailedMutate()}
            className="py-3 px-5 w-full rounded cursor-pointer bg-gray-100 text-gray-800 font-semibold text-sm hover:bg-gray-200"
          >
            {clearingQueue && <Icon type="loading" size={14} />} Clear Failed Queue ({failed_queue.length} Keywords)
          </button>
        </div>
      )}
    </div>
  );
};

export default ScraperSettings;
