import * as React from 'react';
import {
  Button,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  SelectList,
  SelectOption,
  ToolbarItem,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import { MicrochipIcon } from '@patternfly/react-icons/dist/js/icons/microchip-icon';
import { Trans } from 'react-i18next';
import { TFunction } from 'i18next';

import { useFetch } from '../../hooks/useFetch';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { DeviceList, EnrollmentRequest, EnrollmentRequestList } from '@flightctl/types';

import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';
import { useDeleteListAction } from '../ListPage/ListPageActions';
import AddDeviceModal from './AddDeviceModal/AddDeviceModal';
import { sortByCreationTimestamp, sortByDisplayName, sortByName } from '../../utils/sort/generic';
import { sortDeviceStatus, sortDevicesByFleet } from '../../utils/sort/device';
import Table, { TableColumn } from '../Table/Table';
import EnrollmentRequestTableRow from '../EnrollmentRequest/EnrollmentRequestTableRow';
import DeviceTableToolbar from './DeviceTableToolbar';
import { useDeviceFilters } from './useDeviceFilters';
import DeviceTableRow from './DeviceTableRow';
import TableActions from '../Table/TableActions';
import { getResourceId } from '../../utils/resource';
import { DeviceLikeResource, isEnrollmentRequest } from '../../types/extraTypes';
import MassDeleteDeviceModal from '../modals/massModals/MassDeleteDeviceModal/MassDeleteDeviceModal';
import MassApproveDeviceModal from '../modals/massModals/MassApproveDeviceModal/MassApproveDeviceModal';
import DeviceEnrollmentModal from '../EnrollmentRequest/DeviceEnrollmentModal/DeviceEnrollmentModal';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import { useTableSort } from '../../hooks/useTableSort';
import { useTableSelect } from '../../hooks/useTableSelect';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppContext } from '../../hooks/useAppContext';
import { Link, ROUTE } from '../../hooks/useNavigate';
import { FilterSearchParams } from '../../utils/status/common';
import { getApplicatioStatusHelperText, getDeviceStatusHelperText, getUpdateStatusHelperText } from '../Status/utils';

type DeviceEmptyStateProps = {
  onAddDevice: VoidFunction;
};

const DeviceEmptyState: React.FC<DeviceEmptyStateProps> = ({ onAddDevice }) => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={MicrochipIcon} titleText={t('No devices here!')}>
      <EmptyStateBody>
        <Trans t={t}>
          You can add devices and label them to match fleets, or your can{' '}
          <Link to={ROUTE.FLEETS}>start with a fleet</Link> and add devices into it.
        </Trans>
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button onClick={onAddDevice}>{t('Add devices')}</Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const getDeviceColumns = (t: TFunction): TableColumn<DeviceLikeResource>[] => [
  {
    name: t('Name'),
    onSort: sortByDisplayName,
  },
  {
    name: t('Fingerprint'),
    onSort: sortByName,
  },
  {
    name: t('Fleet'),
    onSort: sortDevicesByFleet,
  },
  {
    name: t('Application status'),
    helperText: getApplicatioStatusHelperText(t),
    onSort: (resources: Array<DeviceLikeResource>) => sortDeviceStatus(resources, 'ApplicationStatus'),
  },
  {
    name: t('Device status'),
    helperText: getDeviceStatusHelperText(t),
    onSort: (resources: Array<DeviceLikeResource>) => sortDeviceStatus(resources, 'DeviceStatus'),
    defaultSort: true,
  },
  {
    name: t('Update status'),
    helperText: getUpdateStatusHelperText(t),
    onSort: (resources: Array<DeviceLikeResource>) => sortDeviceStatus(resources, 'SystemUpdateStatus'),
  },
  {
    name: t('Created at'),
    onSort: sortByCreationTimestamp,
  },
];

interface DeviceTableProps {
  searchParams: URLSearchParams;
  resources: Array<DeviceLikeResource>;
  refetch: VoidFunction;
}

export const DeviceTable = ({ resources, searchParams, refetch }: DeviceTableProps) => {
  const { t } = useTranslation();
  const [requestId, setRequestId] = React.useState<string>();
  const [addDeviceModal, setAddDeviceModal] = React.useState(false);
  const [isMassDeleteModalOpen, setIsMassDeleteModalOpen] = React.useState(false);
  const [isMassApproveModalOpen, setIsMassApproveModalOpen] = React.useState(false);
  const { remove } = useFetch();

  const deviceColumns = React.useMemo(() => getDeviceColumns(t), [t]);

  const { filteredData, ...rest } = useDeviceFilters(resources, searchParams);
  const { getSortParams, sortedData } = useTableSort(filteredData, deviceColumns);

  const { onRowSelect, hasSelectedRows, isAllSelected, isRowSelected, setAllSelected } = useTableSelect();

  const { deleteAction: deleteDeviceAction, deleteModal: deleteDeviceModal } = useDeleteListAction({
    resourceType: 'Device',
    onDelete: async (resourceId: string) => {
      await remove(`devices/${resourceId}`);
      refetch();
    },
  });

  const { deleteAction: deleteErAction, deleteModal: deleteErModal } = useDeleteListAction({
    resourceType: 'Enrollment request',
    onDelete: async (resourceId: string) => {
      await remove(`enrollmentrequests/${resourceId}`);
      refetch();
    },
  });

  const currentEnrollmentRequest = resources.find(
    (res) => res.metadata.name === requestId && isEnrollmentRequest(res),
  ) as EnrollmentRequest | undefined;

  return (
    <>
      <DeviceTableToolbar {...rest}>
        <ToolbarItem>
          <Button onClick={() => setAddDeviceModal(true)}>{t('Add devices')}</Button>
        </ToolbarItem>
        <ToolbarItem>
          <TableActions>
            <SelectList>
              <SelectOption isDisabled={!hasSelectedRows} onClick={() => setIsMassApproveModalOpen(true)}>
                {t('Approve')}
              </SelectOption>
              <SelectOption isDisabled={!hasSelectedRows} onClick={() => setIsMassDeleteModalOpen(true)}>
                {t('Delete')}
              </SelectOption>
            </SelectList>
          </TableActions>
        </ToolbarItem>
      </DeviceTableToolbar>
      <Table
        aria-label={t('Devices table')}
        columns={deviceColumns}
        emptyFilters={filteredData.length === 0 && resources.length > 0}
        getSortParams={getSortParams}
        isAllSelected={isAllSelected}
        onSelectAll={setAllSelected}
      >
        <Tbody>
          {sortedData.map((resource, index) =>
            isEnrollmentRequest(resource) ? (
              <EnrollmentRequestTableRow
                key={getResourceId(resource)}
                er={resource}
                deleteAction={deleteErAction}
                onRowSelect={onRowSelect}
                isRowSelected={isRowSelected}
                rowIndex={index}
                onApprove={setRequestId}
              />
            ) : (
              <DeviceTableRow
                key={getResourceId(resource)}
                device={resource}
                deleteAction={deleteDeviceAction}
                onRowSelect={onRowSelect}
                isRowSelected={isRowSelected}
                rowIndex={index}
              />
            ),
          )}
        </Tbody>
      </Table>
      {resources.length === 0 && <DeviceEmptyState onAddDevice={() => setAddDeviceModal(true)} />}
      {deleteDeviceModal}
      {deleteErModal}
      {addDeviceModal && <AddDeviceModal onClose={() => setAddDeviceModal(false)} />}
      {currentEnrollmentRequest && (
        <DeviceEnrollmentModal
          enrollmentRequest={currentEnrollmentRequest}
          onClose={(updateList) => {
            setRequestId(undefined);
            updateList && refetch();
          }}
        />
      )}
      {isMassDeleteModalOpen && (
        <MassDeleteDeviceModal
          onClose={() => setIsMassDeleteModalOpen(false)}
          resources={sortedData.filter(isRowSelected)}
          onDeleteSuccess={() => {
            setIsMassDeleteModalOpen(false);
            refetch();
          }}
        />
      )}
      {isMassApproveModalOpen && (
        <MassApproveDeviceModal
          onClose={() => setIsMassApproveModalOpen(false)}
          resources={sortedData.filter(isRowSelected)}
          onApproveSuccess={() => {
            setAllSelected(false);
            setIsMassApproveModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
};

const DeviceList = () => {
  const { t } = useTranslation();
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams] = useSearchParams();
  const filterByFleetId = searchParams.get(FilterSearchParams.Fleet) || undefined;

  const [devicesList, devicesLoading, devicesError, devicesRefetch] = useFetchPeriodically<DeviceList>({
    endpoint: `devices${filterByFleetId ? `?owner=Fleet/${filterByFleetId}` : ''}`,
  });

  const [erList, erLoading, erError, erRefetch] = useFetchPeriodically<EnrollmentRequestList>({
    endpoint: filterByFleetId ? '' : 'enrollmentrequests',
  });

  const data = React.useMemo(() => {
    const devices = devicesList?.items || [];
    if (filterByFleetId) {
      return devices;
    }

    const deviceIds = devices.reduce((acc, curr) => {
      acc[curr.metadata.name || ''] = {};
      return acc;
    }, {});

    const ers = erList?.items || [];
    return [...devices, ...ers.filter((er) => !deviceIds[er.metadata.name || ''])];
  }, [devicesList?.items, erList?.items, filterByFleetId]);

  const refetch = () => {
    devicesRefetch();
    erRefetch();
  };

  return (
    <>
      <ListPage title={t('Devices')}>
        <ListPageBody error={devicesError || erError} loading={devicesLoading || (erLoading && !filterByFleetId)}>
          <DeviceTable resources={data} refetch={refetch} searchParams={searchParams} />
        </ListPageBody>
      </ListPage>
    </>
  );
};

export default DeviceList;
