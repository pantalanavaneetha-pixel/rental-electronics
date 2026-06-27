import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, VaultSafe, ShieldAlertIcon } from './PremiumIcons';

export default function StatusBadge({ status }) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Settled':
        return {
          className: 'status-settled',
          icon: <CheckCircleIcon size={14} />
        };
      case 'Under Review':
        return {
          className: 'status-under-review',
          icon: <ExclamationCircleIcon size={14} />
        };
      case 'Held':
        return {
          className: 'status-held',
          icon: <VaultSafe size={14} />
        };
      case 'Isolated Repair':
        return {
          className: 'status-isolated-repair',
          icon: <ShieldAlertIcon size={14} />
        };
      default:
        return {
          className: 'status-held',
          icon: null
        };
    }
  };

  const { className, icon } = getBadgeConfig();

  return (
    <span className={`status-badge ${className}`}>
      {icon}
      <span>{status}</span>
    </span>
  );
}
