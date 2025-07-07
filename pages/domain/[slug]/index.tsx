import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../components/common/Sidebar';
import TopBar from '../../../components/common/TopBar';
import DomainHeader from '../../../components/domains/DomainHeader';
import KeywordsTable from '../../../components/keywords/KeywordsTable';
import AddDomain from '../../../components/domains/AddDomain';
import DomainSettings from '../../../components/domains/DomainSettings';
import exportCSV from '../../../utils/client/exportcsv';
import Settings from '../../../components/settings/Settings';
import { useFetchDomains } from '../../../services/domains';
import { useFetchKeywords } from '../../../services/keywords';
import { useFetchSettings } from '../../../services/settings';
import AddKeywords from '../../../components/keywords/AddKeywords';
import Footer from '../../../components/common/Footer';

const SingleDomain: NextPage = () => {
  const router = useRouter();
  const [showAddKeywords, setShowAddKeywords] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined | number>(undefined);

  const { data: appSettingsData, isLoading: isAppSettingsLoading } = useFetchSettings();
  const appSettings: SettingsType = appSettingsData?.settings || {};
  const { scraper_type = '', available_scapers = [] } = appSettings;

  const { data: domainsData } = useFetchDomains(router);

  const activeScraper = useMemo(() => available_scapers.find((scraper) => scraper.value === scraper_type), [scraper_type, available_scapers]);

  // Renamed from activDomain to activeDomain for clarity
  const activeDomain: DomainType | null = useMemo(() => {
    if (domainsData?.domains && router.query?.slug) {
      return domainsData.domains.find((x: DomainType) => x.slug === router.query.slug) || null;
    }
    return null;
  }, [router.query.slug, domainsData]);

  // Use safe JSON parsing with try-catch
  const domainSc = useMemo(() => {
    try {
      return activeDomain?.search_console ? JSON.parse(activeDomain.search_console) : {};
    } catch (e) {
      console.error('Invalid search_console JSON:', e);
      return {};
    }
  }, [activeDomain]);

  const domainHasScAPI = useMemo(() => {
    return !!(domainSc?.client_email && domainSc?.private_key);
  }, [domainSc]);

  const { keywordsData, keywordsLoading } = useFetchKeywords(
    router,
    activeDomain?.domain || '',
    setKeywordSPollInterval,
    keywordSPollInterval
  );

  // Memoize keyword and domain arrays
  const theDomains: DomainType[] = useMemo(() => domainsData?.domains || [], [domainsData]);
  const theKeywords: KeywordType[] = useMemo(() => keywordsData?.keywords || [], [keywordsData]);

  // Extracted conditional for readability
  const showNoScraperWarning = !isAppSettingsLoading && (!scraper_type || scraper_type === 'none');

  return (
    <div className="Domain">
      {showNoScraperWarning && (
        <div className="p-3 bg-red-600 text-white text-sm text-center">
          A scraper or proxy has not been set up. Open Settings to configure and start using the app.
        </div>
      )}

      {activeDomain?.domain && (
        <Head>
          <title>{`${activeDomain.domain} - SerpBear`}</title>
        </Head>
      )}

      <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />

      <div className="flex w-full max-w-7xl mx-auto">
        <Sidebar domains={theDomains} showAddModal={() => setShowAddDomain(true)} />

        <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
          {activeDomain?.domain ? (
            <DomainHeader
              domain={activeDomain}
              domains={theDomains}
              showAddModal={setShowAddKeywords}
              showSettingsModal={setShowDomainSettings}
              exportCsv={() => exportCSV(theKeywords, activeDomain.domain)}
            />
          ) : (
            <div className="w-full lg:h-[100px]"></div>
          )}

          <KeywordsTable
            isLoading={keywordsLoading}
            domain={activeDomain}
            keywords={theKeywords}
            showAddModal={showAddKeywords}
            setShowAddModal={setShowAddKeywords}
            isConsoleIntegrated={!!(appSettings?.search_console_integrated || domainHasScAPI)}
            settings={appSettings}
          />
        </div>
      </div>

      <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
        <AddDomain closeModal={() => setShowAddDomain(false)} domains={theDomains} />
      </CSSTransition>

      <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
        <DomainSettings domain={showDomainSettings && activeDomain?.domain ? activeDomain : null} closeModal={setShowDomainSettings} />
      </CSSTransition>

      <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
        <Settings closeSettings={() => setShowSettings(false)} />
      </CSSTransition>

      <CSSTransition in={showAddKeywords} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
        <AddKeywords
          domain={activeDomain?.domain || ''}
          scraperName={activeScraper?.label || ''}
          keywords={theKeywords}
          allowsCity={!!activeScraper?.allowsCity}
          closeModal={() => setShowAddKeywords(false)}
        />
      </CSSTransition>

      <Footer currentVersion={appSettings?.version || ''} />
    </div>
  );
};

export default SingleDomain;
