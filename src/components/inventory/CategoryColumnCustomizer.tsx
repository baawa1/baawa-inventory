import { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';

export const CATEGORY_COLUMNS: DashboardTableColumn[] = [
  {
    key: 'name',
    label: 'Category Name',
    sortable: true,
    defaultVisible: true,
    required: true,
    mobileLabel: 'Category',
    hideOnMobile: false,
    mobileOrder: 1,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    defaultVisible: true,
    mobileLabel: 'Description',
    hideOnMobile: true, // Hide on mobile since it's shown in the card title section
    mobileOrder: 2,
  },
  {
    key: 'parent',
    label: 'Parent Category',
    sortable: false,
    defaultVisible: true,
    mobileLabel: 'Parent',
    mobileOrder: 3,
  },
  {
    key: 'products',
    label: 'Products',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Products',
    mobileOrder: 4,
  },
  {
    key: 'subcategories',
    label: 'Subcategories',
    sortable: false,
    defaultVisible: true,
    mobileLabel: 'Subcategories',
    mobileOrder: 5,
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Status',
    mobileOrder: 6,
  },
  {
    key: 'wordpress_id',
    label: 'WordPress ID',
    sortable: true,
    defaultVisible: false,
    mobileLabel: 'WP ID',
    mobileOrder: 7,
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    defaultVisible: true,
    mobileLabel: 'Created',
    mobileOrder: 8,
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    defaultVisible: false,
    mobileLabel: 'Updated',
    mobileOrder: 9,
  },
];

export default CATEGORY_COLUMNS;