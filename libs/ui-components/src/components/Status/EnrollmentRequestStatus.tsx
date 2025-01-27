import * as React from 'react';

import { EnrollmentRequest } from '@flightctl/types';
import { getApprovalStatus, getEnrollmentRequestsStatusItems } from '../../utils/status/enrollmentRequest';
import { EnrollmentRequestStatus as EnrollmentRequestStatusType } from '../../utils/status/common';
import { useTranslation } from '../../hooks/useTranslation';
import StatusDisplay from './StatusDisplay';

const EnrollmentRequestStatus = ({ er }: { er?: EnrollmentRequest }) => {
  const { t } = useTranslation();

  const status = er ? getApprovalStatus(er) : EnrollmentRequestStatusType.Unknown;
  const statusItems = getEnrollmentRequestsStatusItems(t);

  const item = statusItems.find((statusItem) => {
    return statusItem.id === status;
  });
  return <StatusDisplay item={item} />;
};

export default EnrollmentRequestStatus;
