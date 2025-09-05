import { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';

export const BRAND_COLUMNS: DashboardTableColumn[] = [
  {
    key: 'name',
    label: 'Brand Name',
    sortable: true,
    defaultVisible: true,
    required: true,
    mobileLabel: 'Brand',
    hideOnMobile: false,
    mobileOrder: 1,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    defaultVisible: true,
    mobileLabel: 'Description',
    hideOnMobile: true, // Hide on mobile since it's shown in the card subtitle
    mobileOrder: 2,
  },
  {
    key: 'products',
    label: 'Products',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Products',
    mobileOrder: 3,
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Status',
    mobileOrder: 4,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
    mobileLabel: 'WP ID',
    mobileOrder: 5,
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Created',
    mobileOrder: 6,
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    defaultVisible: false,
    mobileLabel: 'Updated',
    mobileOrder: 7,
  },
];

export default BRAND_COLUMNS;