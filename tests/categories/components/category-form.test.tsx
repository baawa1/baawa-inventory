import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../../../src/components/inventory/category-form';
import { CategoryDialog } from '../../../src/components/inventory/category-dialog';
import { CategoryList } from '../../../src/components/inventory/category-list';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API hooks
jest.mock('../../../src/hooks/api/use-categories', () => ({
  useCategories: jest.fn(),
  useCreateCategory: jest.fn(),
  useUpdateCategory: jest.fn(),
  useDeleteCategory: jest.fn(),
}));

const mockUseCategories =
  require('../../../src/hooks/api/use-categories').useCategories;
const mockUseCreateCategory =
  require('../../../src/hooks/api/use-categories').useCreateCategory;
const mockUseUpdateCategory =
  require('../../../src/hooks/api/use-categories').useUpdateCategory;
const mockUseDeleteCategory =
  require('../../../src/hooks/api/use-categories').useDeleteCategory;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('Category Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CategoryForm', () => {
    const mockCategory = {
      id: '1',
      name: 'Test Category',
      description: 'Test Description',
      isActive: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCreateMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null as Error | null,
    };

    const mockUpdateMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null as Error | null,
    };

    beforeEach(() => {
      mockUseCreateCategory.mockReturnValue(mockCreateMutation);
      mockUseUpdateCategory.mockReturnValue(mockUpdateMutation);
    });

    it('renders create form correctly', () => {
      renderWithQueryClient(<CategoryForm />);

      expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create category/i })
      ).toBeInTheDocument();
    });

    it('renders edit form correctly', () => {
      renderWithQueryClient(<CategoryForm category={mockCategory} />);

      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /update category/i })
      ).toBeInTheDocument();
    });

    it('submits create form with valid data', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryForm />);

      await user.type(screen.getByLabelText(/category name/i), 'New Category');
      await user.type(screen.getByLabelText(/description/i), 'New Description');
      await user.click(
        screen.getByRole('button', { name: /create category/i })
      );

      expect(mockCreateMutation.mutate).toHaveBeenCalledWith({
        name: 'New Category',
        description: 'New Description',
        isActive: true,
        parentId: null,
      });
    });

    it('submits update form with valid data', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryForm category={mockCategory} />);

      await user.clear(screen.getByLabelText(/category name/i));
      await user.type(
        screen.getByLabelText(/category name/i),
        'Updated Category'
      );
      await user.click(
        screen.getByRole('button', { name: /update category/i })
      );

      expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
        id: '1',
        name: 'Updated Category',
        description: 'Test Description',
        isActive: true,
        parentId: null,
      });
    });

    it('shows validation errors for invalid data', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryForm />);

      await user.click(
        screen.getByRole('button', { name: /create category/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/category name is required/i)
        ).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', () => {
      mockCreateMutation.isPending = true;
      renderWithQueryClient(<CategoryForm />);

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });

    it('shows error state', () => {
      mockCreateMutation.error = new Error('Creation failed');
      renderWithQueryClient(<CategoryForm />);

      expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
    });

    it('handles parent category selection', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryForm />);

      const parentSelect = screen.getByLabelText(/parent category/i);
      await user.selectOptions(parentSelect, 'parent-1');

      await user.click(
        screen.getByRole('button', { name: /create category/i })
      );

      expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 'parent-1',
        })
      );
    });
  });

  describe('CategoryDialog', () => {
    const mockCategory = {
      id: '1',
      name: 'Test Category',
      description: 'Test Description',
      isActive: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('renders create dialog correctly', () => {
      renderWithQueryClient(
        <CategoryDialog open={true} onOpenChange={jest.fn()} />
      );

      expect(screen.getByText(/create new category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    });

    it('renders edit dialog correctly', () => {
      renderWithQueryClient(
        <CategoryDialog
          open={true}
          onOpenChange={jest.fn()}
          category={mockCategory}
        />
      );

      expect(screen.getByText(/edit category/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    it('closes dialog on cancel', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();

      renderWithQueryClient(
        <CategoryDialog open={true} onOpenChange={onOpenChange} />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('CategoryList', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Category 1',
        description: 'Description 1',
        isActive: true,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Category 2',
        description: 'Description 2',
        isActive: false,
        parentId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockDeleteMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null as Error | null,
    };

    const mockUpdateMutation = {
      mutate: jest.fn(),
      isPending: false,
      error: null as Error | null,
    };

    beforeEach(() => {
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCategory.mockReturnValue(mockDeleteMutation);
      mockUseUpdateCategory.mockReturnValue(mockUpdateMutation);
    });

    it('renders category list correctly', () => {
      renderWithQueryClient(<CategoryList />);

      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      mockUseCategories.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClient(<CategoryList />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows empty state', () => {
      mockUseCategories.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(<CategoryList />);
      expect(screen.getByText(/no categories found/i)).toBeInTheDocument();
    });

    it('handles category deletion', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryList />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith('1');
    });

    it('shows error state', () => {
      mockUseCategories.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load categories'),
      });

      renderWithQueryClient(<CategoryList />);
      expect(
        screen.getByText(/failed to load categories/i)
      ).toBeInTheDocument();
    });

    it('filters categories by search term', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryList />);

      const searchInput = screen.getByPlaceholderText(/search categories/i);
      await user.type(searchInput, 'Category 1');

      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.queryByText('Category 2')).not.toBeInTheDocument();
    });

    it('toggles category status', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<CategoryList />);

      const toggleButtons = screen.getAllByRole('button', {
        name: /toggle status/i,
      });
      await user.click(toggleButtons[0]);

      expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
        id: '1',
        isActive: false,
      });
    });

    it('shows parent-child relationships', () => {
      renderWithQueryClient(<CategoryList />);

      expect(
        screen.getByText(/subcategory of category 1/i)
      ).toBeInTheDocument();
    });
  });
});
