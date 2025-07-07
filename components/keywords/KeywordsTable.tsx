import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { filterKeywords, keywordsByDevice, sortKeywords } from '../../utils/client/sortFilter';
import Icon from '../common/Icon';
import Keyword from './Keyword';
import KeywordDetails from './KeywordDetails';
import KeywordFilters from './KeywordFilter';
import Modal from '../common/Modal';
import { useDeleteKeywords, useFavKeywords, useRefreshKeywords } from '../../services/keywords';
import KeywordTagManager from './KeywordTagManager';
import AddTags from './AddTags';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import { useUpdateSettings } from '../../services/settings';
import { defaultSettings } from '../settings/Settings';

// Added sorting types
const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
};

type KeywordsTableProps = {
  domain: DomainType | null,
  keywords: KeywordType[],
  isLoading: boolean,
  showAddModal: boolean,
  setShowAddModal: Function,
  isConsoleIntegrated: boolean,
  settings?: SettingsType
};

const KeywordsTable = (props: KeywordsTableProps) => {
  const titleColumnRef = useRef(null);
  const { keywords = [], isLoading = true, isConsoleIntegrated = false, settings } = props;
  const showSCData = isConsoleIntegrated;

  const [device, setDevice] = useState<string>('desktop');
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [showKeyDetails, setShowKeyDetails] = useState<KeywordType | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
  const [showTagManager, setShowTagManager] = useState<null | number>(null);
  const [showAddTags, setShowAddTags] = useState<boolean>(false);
  const [SCListHeight, setSCListHeight] = useState(500);
  const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<string>(SORT_DIRECTIONS.ASC); // Added sortDirection
  const [scDataType, setScDataType] = useState<string>('threeDays');
  const [showScDataTypes, setShowScDataTypes] = useState<boolean>(false);
  const [maxTitleColumnWidth, setMaxTitleColumnWidth] = useState(235);

  const { mutate: deleteMutate } = useDeleteKeywords(() => {});
  const { mutate: favoriteMutate } = useFavKeywords(() => {});
  const { mutate: refreshMutate } = useRefreshKeywords(() => {});
  const { mutate: updateMutate } = useUpdateSettings(() => {});

  const [isMobile] = useIsMobile();

  useWindowResize(() => {
    setSCListHeight(window.innerHeight - (isMobile ? 200 : 400));
    if (titleColumnRef.current) {
      setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
    }
  });

  useEffect(() => {
    if (titleColumnRef.current) {
      setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
    }
  }, [titleColumnRef]);

  const tableColumns = settings?.keywordsColumns || ['Best', 'History', 'Volume', 'Search Console'];

  const scDataObject: { [k: string]: string } = {
    threeDays: 'Last Three Days',
    sevenDays: 'Last Seven Days',
    thirtyDays: 'Last Thirty Days',
    avgThreeDays: 'Last Three Days Avg',
    avgSevenDays: 'Last Seven Days Avg',
    avgThirtyDays: 'Last Thirty Days Avg'
  };

  const processedKeywords: { [key: string]: KeywordType[] } = useMemo(() => {
    const procKeywords = keywords.filter((x) => x.device === device);
    const filteredKeywords = filterKeywords(procKeywords, filterParams);
    const sortedKeywords = sortKeywords(filteredKeywords, sortBy, scDataType, sortDirection); // Enhanced sort logic
    return keywordsByDevice(sortedKeywords, device);
  }, [keywords, device, sortBy, filterParams, scDataType, sortDirection]);

  const allDomainTags: string[] = useMemo(() => {
    const allTags = keywords
      .reduce((acc: string[], keyword) => [...acc, ...keyword.tags], [])
      .filter((t) => t && t.trim() !== '');
    return [...new Set(allTags)];
  }, [keywords]);

  const updateColumns = (column: string) => {
    const newColumns = tableColumns.includes(column)
      ? tableColumns.filter((col) => col !== column)
      : [...tableColumns, column];
    updateMutate({ ...defaultSettings, ...settings, keywordsColumns: newColumns });
  };

  const selectedAllItems = useMemo(() => selectedKeywords.length === processedKeywords[device].length, [selectedKeywords, processedKeywords, device]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC);
    } else {
      setSortBy(column);
      setSortDirection(SORT_DIRECTIONS.ASC);
    }
  };

  const shouldHideColumn = useCallback((col: string) => {
    return settings?.keywordsColumns && !settings?.keywordsColumns.includes(col) ? 'lg:hidden' : '';
  }, [settings?.keywordsColumns]);

  const Row = ({ data, index, style }: ListChildComponentProps) => {
    const keyword = data[index];
    return (
      <Keyword
        key={keyword.ID}
        style={style}
        index={index}
        selected={selectedKeywords.includes(keyword.ID)}
        selectKeyword={(id: number) => {
          setSelectedKeywords((prev) =>
            prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
          );
        }}
        keywordData={keyword}
        refreshkeyword={() => refreshMutate({ ids: [keyword.ID] })}
        favoriteKeyword={favoriteMutate}
        manageTags={() => setShowTagManager(keyword.ID)}
        removeKeyword={() => {
          setSelectedKeywords([keyword.ID]);
          setShowRemoveModal(true);
        }}
        showKeywordDetails={() => setShowKeyDetails(keyword)}
        lastItem={index === processedKeywords[device].length - 1}
        showSCData={showSCData}
        scDataType={scDataType}
        tableColumns={tableColumns}
        maxTitleColumnWidth={maxTitleColumnWidth}
      />
    );
  };

  return (
    <div>
      {/* Table header column added with onClick handlers for sorting */}
      <div className='table-header flex justify-between bg-gray-100 p-3 font-bold'>
        <div className='flex-1 cursor-pointer' onClick={() => toggleSort('keyword')}>Keyword</div>
        <div className='w-24 text-center cursor-pointer' onClick={() => toggleSort('position')}>Position</div>
        <div className={`w-24 text-center cursor-pointer ${shouldHideColumn('Best')}`} onClick={() => toggleSort('best')}>Best</div>
        <div className={`w-32 text-center cursor-pointer ${shouldHideColumn('History')}`} onClick={() => toggleSort('history')}>History</div>
        <div className={`w-24 text-center cursor-pointer ${shouldHideColumn('Volume')}`} onClick={() => toggleSort('volume')}>Volume</div>
        <div className='flex-1'>URL</div>
      </div>

      {/* Keyword list rendering */}
      <div className='keyword-list'>
        {processedKeywords[device].length > 0 ? (
          <List
            itemData={processedKeywords[device]}
            itemCount={processedKeywords[device].length}
            itemSize={isMobile ? 146 : 57}
            height={SCListHeight}
            width='100%'
          >
            {Row}
          </List>
        ) : (
          <div className='p-5 text-center text-gray-500'>
            {isLoading ? 'Loading Keywords...' : 'No Keywords Available'}
          </div>
        )}
      </div>

      {showKeyDetails && <KeywordDetails keyword={showKeyDetails} closeDetails={() => setShowKeyDetails(null)} />}
      {showRemoveModal && (
        <Modal title='Remove Keywords' closeModal={() => setShowRemoveModal(false)}>
          <p>Are you sure you want to remove {selectedKeywords.length} keyword(s)?</p>
          <div className='mt-4 flex justify-end'>
            <button className='mr-2' onClick={() => setShowRemoveModal(false)}>Cancel</button>
            <button className='bg-red-500 text-white px-4 py-1' onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); }}>Remove</button>
          </div>
        </Modal>
      )}

      {showTagManager && (
        <KeywordTagManager
          allTags={allDomainTags}
          keyword={keywords.find((k) => k.ID === showTagManager)}
          closeModal={() => setShowTagManager(null)}
        />
      )}

      {showAddTags && (
        <AddTags
          existingTags={allDomainTags}
          keywords={keywords.filter((k) => selectedKeywords.includes(k.ID))}
          closeModal={() => setShowAddTags(false)}
        />
      )}

      <Toaster position='bottom-center' containerClassName='react_toaster' />
    </div>
  );
};

export default KeywordsTable;
