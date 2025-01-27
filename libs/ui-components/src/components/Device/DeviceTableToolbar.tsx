import * as React from 'react';
import {
  Badge,
  MenuToggle,
  SearchInput,
  Select,
  SelectGroup,
  SelectList,
  SelectProps,
  Toolbar,
  ToolbarChip,
  ToolbarChipGroup,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import TableTextSearch, { TableTextSearchProps } from '../Table/TableTextSearch';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppContext } from '../../hooks/useAppContext';
import DeviceStatusFilterSelect from './DeviceStatusFilterSelect';
import { FilterSearchParams, StatusItem, StatusItemType } from '../../utils/status/common';
import { getDeviceStatusItems } from '../../utils/status/devices';
import { getApplicationSummaryStatusItems } from '../../utils/status/applications';
import { getSystemUpdateStatusItems } from '../../utils/status/system';

type FilterCategory = {
  key: 'id' | FilterSearchParams;
};

type DeviceTableToolbarProps = {
  search: TableTextSearchProps['value'];
  setSearch: TableTextSearchProps['setValue'];
  fleetName: string | undefined;
  setFleetName: (fleetName: string) => void;
  filters: {
    statuses: Array<string>; // statuses formed by statusType#statusId (eg. devSt#Pending)
  };
  children: React.ReactNode;
};

const DeviceTableToolbar: React.FC<DeviceTableToolbarProps> = ({
  fleetName,
  setFleetName,
  search,
  setSearch,
  filters,
  children,
}) => {
  const { t } = useTranslation();
  const [isStatusExpanded, setIsStatusExpanded] = React.useState(false);
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const fleetNameFilter = searchParams.get(FilterSearchParams.Fleet);

  const statusesItems = React.useMemo(() => {
    return {
      device: getDeviceStatusItems(t),
      app: getApplicationSummaryStatusItems(t),
      update: getSystemUpdateStatusItems(t),
    };
  }, [t]);

  const onStatusSelect: SelectProps['onSelect'] = (e, selection) => {
    const checked = (e?.target as HTMLInputElement)?.checked;
    const [paramName, value] = (selection as string).split('#');
    setSearchParams((prev) => {
      if (checked) {
        prev.append(paramName, value);
      } else {
        prev.delete(paramName, value);
      }
      return prev;
    });
  };

  const clearFleetFilter = () => {
    setSearchParams((prev) => {
      prev.set(FilterSearchParams.Fleet, '');
      return prev;
    });
  };

  const onApplyFleetFilter = () => {
    // The change in the URL is detected by DeviceList. It will change the query to filter by fleet
    setSearchParams((prev) => {
      prev.set(FilterSearchParams.Fleet, fleetName || '');
      return prev;
    });
  };
  const getStatusChips = <T extends StatusItemType>(statusList: Array<StatusItem<T>>) =>
    statusList
      .filter((statusItem) => {
        return filters.statuses.includes(`${statusItem.type}#${statusItem.id}`);
      })
      .map((a) => {
        return {
          key: `${a.type}#${a.id}`,
          node: <>{a.label}</>,
        };
      });

  const onDeleteFilterGroup = (category: string | ToolbarChipGroup) => {
    const { key } = category as FilterCategory;
    if (
      [FilterSearchParams.DeviceStatus, FilterSearchParams.AppStatus, FilterSearchParams.UpdatedStatus].includes(
        key as FilterSearchParams,
      )
    ) {
      const [paramName, value] = (key as string).split('#');
      setSearchParams((prev: URLSearchParams) => {
        prev.delete(paramName, value);
        return prev;
      });
    } else {
      // Clear all filters
      setSearchParams((prev: URLSearchParams) => {
        prev.delete(FilterSearchParams.Fleet);
        prev.delete(FilterSearchParams.DeviceStatus);
        prev.delete(FilterSearchParams.AppStatus);
        prev.delete(FilterSearchParams.UpdatedStatus);
        return prev;
      });
      setSearch('');
    }
  };

  const onDeleteFilterChip = (category: string | ToolbarChipGroup, chip: ToolbarChip | string) => {
    const filterName = category as string;
    if (filterName === 'id') {
      setSearch('');
    } else if (filterName === FilterSearchParams.Fleet) {
      setSearchParams((prev: URLSearchParams) => {
        prev.delete(FilterSearchParams.Fleet);
        return prev;
      });
    } else {
      const [paramName, value] = (chip as ToolbarChip).key.split('#');
      setSearchParams((prev) => {
        prev.delete(paramName, value);
        return prev;
      });
    }
  };

  return (
    <Toolbar
      id="devices-toolbar"
      clearFiltersButtonText={t('Clear all filters')}
      clearAllFilters={() => onDeleteFilterGroup({ key: '', name: '' })}
    >
      <ToolbarContent>
        <ToolbarGroup variant="filter-group">
          <ToolbarFilter
            chips={getStatusChips(statusesItems.app)}
            deleteChip={onDeleteFilterChip}
            deleteChipGroup={onDeleteFilterGroup}
            categoryName={{
              key: FilterSearchParams.AppStatus,
              name: t('Application status'),
            }}
          >
            <Select
              aria-label={t('Filters')}
              role="menu"
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                  isExpanded={isStatusExpanded}
                >
                  {t('Filters')}
                  {filters.statuses.length > 0 && <Badge isRead>{filters.statuses.length}</Badge>}
                </MenuToggle>
              )}
              onSelect={onStatusSelect}
              isOpen={isStatusExpanded}
              onOpenChange={setIsStatusExpanded}
            >
              <SelectList>
                <SelectGroup label={t('Application status')}>
                  <DeviceStatusFilterSelect
                    type={FilterSearchParams.AppStatus}
                    items={statusesItems.app}
                    selectedFilters={filters.statuses}
                  />
                </SelectGroup>
                <SelectGroup label={t('Device status')}>
                  <DeviceStatusFilterSelect
                    type={FilterSearchParams.DeviceStatus}
                    items={statusesItems.device}
                    selectedFilters={filters.statuses}
                  />
                </SelectGroup>
                <SelectGroup label={t('System update status')}>
                  <DeviceStatusFilterSelect
                    type={FilterSearchParams.UpdatedStatus}
                    items={statusesItems.update}
                    selectedFilters={filters.statuses}
                  />
                </SelectGroup>
              </SelectList>
            </Select>
          </ToolbarFilter>
        </ToolbarGroup>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem variant="search-filter">
            <ToolbarFilter
              chips={getStatusChips(statusesItems.device)}
              deleteChip={onDeleteFilterChip}
              deleteChipGroup={onDeleteFilterGroup}
              categoryName={{
                key: FilterSearchParams.DeviceStatus,
                name: t('Device status'),
              }}
            >
              {' '}
            </ToolbarFilter>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem variant="search-filter">
            <ToolbarFilter
              chips={getStatusChips(statusesItems.update)}
              deleteChip={onDeleteFilterChip}
              deleteChipGroup={onDeleteFilterGroup}
              categoryName={{
                key: FilterSearchParams.UpdatedStatus,
                name: t('Update status'),
              }}
            >
              {' '}
            </ToolbarFilter>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem variant="search-filter">
            <ToolbarFilter
              chips={search ? [search] : []}
              deleteChip={onDeleteFilterChip}
              categoryName={{
                key: 'id',
                name: t('Name / ID'),
              }}
            >
              <TableTextSearch value={search} setValue={setSearch} placeholder={t('Search by name or fingerprint')} />
            </ToolbarFilter>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem variant="search-filter">
          <ToolbarFilter
            chips={fleetNameFilter ? [fleetNameFilter] : []}
            deleteChip={onDeleteFilterChip}
            categoryName={{
              key: FilterSearchParams.Fleet,
              name: t('Fleet'),
            }}
          >
            <SearchInput
              aria-label={t('Fleet name (exact match)')}
              onChange={(_event, value) => setFleetName(value)}
              value={fleetNameFilter ? fleetName : undefined}
              placeholder={t('Fleet name (exact match)')}
              onClear={clearFleetFilter}
              onSearch={onApplyFleetFilter}
            />
          </ToolbarFilter>
        </ToolbarItem>
        {children}
      </ToolbarContent>
    </Toolbar>
  );
};

export default DeviceTableToolbar;
