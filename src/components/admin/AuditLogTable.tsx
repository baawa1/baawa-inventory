'use client';

import { TableColumn } from '@/components/inventory/ColumnCustomizer';

export const auditLogColumns: TableColumn[] = [
  {
    key: 'created_at',
    label: 'Date & Time',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'users',
    label: 'User',
    sortable: false,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'action',
    label: 'Action',
    sortable: true,
    defaultVisible: true,
    required: true,
  },
  {
    key: 'table_name',
    label: 'Table',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'record_id',
    label: 'Record ID',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'ip_address',
    label: 'IP Address',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'user_agent',
    label: 'User Agent',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'old_values',
    label: 'Old Values',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'new_values',
    label: 'New Values',
    sortable: false,
    defaultVisible: false,
  },
];
