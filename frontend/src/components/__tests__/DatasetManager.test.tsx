/**
 * Tests for DatasetManager component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatasetManager } from '../dataset/dataset-manager';
import { AuthProvider } from '@/contexts/auth-context';
import { datasetService } from '@/lib/api';

// Mock the API service
jest.mock('@/lib/api', () => ({
  datasetService: {
    getDatasets: jest.fn(),
    uploadDataset: jest.fn(),
    deleteDataset: jest.fn(),
  },
}));

// Mock the auth context
const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  full_name: 'Test User',
  is_active: true,
};

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null,
};

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthContext,
}));

// Test data
const mockDatasets = [
  {
    id: 'dataset-1',
    user_id: 'user-uuid',
    name: 'Sales Data',
    description: 'Monthly sales figures',
    file_name: 'sales.csv',
    file_type: '.csv',
    file_size: 1024000,
    row_count: 1000,
    column_count: 12,
    processing_status: 'completed',
    data_quality_score: 95,
    is_active: true,
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_accessed_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dataset-2',
    user_id: 'user-uuid',
    name: 'Customer Data',
    description: null,
    file_name: 'customers.csv',
    file_type: '.csv',
    file_size: 512000,
    row_count: 500,
    column_count: 8,
    processing_status: 'pending',
    data_quality_score: null,
    is_active: true,
    is_public: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: null,
    last_accessed_at: null,
  },
];

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('DatasetManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API calls
    (datasetService.getDatasets as jest.Mock).mockResolvedValue(mockDatasets);
    (datasetService.uploadDataset as jest.Mock).mockResolvedValue(mockDatasets[0]);
    (datasetService.deleteDataset as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Component Rendering', () => {
    test('renders dataset manager with user logged in', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Check if main elements are rendered
      expect(screen.getByText('Datasets')).toBeInTheDocument();
      expect(screen.getByText('Upload Dataset')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search datasets...')).toBeInTheDocument();
    });

    test('shows login prompt when user is not logged in', async () => {
      // Mock user not logged in
      mockAuthContext.user = null;
      
      renderWithProviders(<DatasetManager />);
      
      expect(screen.getByText('Please login to manage datasets')).toBeInTheDocument();
    });

    test('displays loading state initially', async () => {
      // Mock loading state
      (datasetService.getDatasets as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      renderWithProviders(<DatasetManager />);
      
      expect(screen.getByText('Loading datasets...')).toBeInTheDocument();
    });
  });

  describe('Dataset Display', () => {
    test('displays datasets correctly after loading', async () => {
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
        expect(screen.getByText('Customer Data')).toBeInTheDocument();
      });
      
      // Check dataset details
      expect(screen.getByText('Monthly sales figures')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
      expect(screen.getByText('512 KB')).toBeInTheDocument();
    });

    test('displays processing status correctly', async () => {
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        // Check status indicators
        const completedStatus = screen.getByText('completed');
        const pendingStatus = screen.getByText('pending');
        
        expect(completedStatus).toBeInTheDocument();
        expect(pendingStatus).toBeInTheDocument();
      });
    });

    test('filters datasets based on search query', async () => {
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
        expect(screen.getByText('Customer Data')).toBeInTheDocument();
      });
      
      // Search for specific dataset
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'Sales' } });
      
      // Should only show Sales Data
      expect(screen.getByText('Sales Data')).toBeInTheDocument();
      expect(screen.queryByText('Customer Data')).not.toBeInTheDocument();
    });

    test('filters datasets by description in search', async () => {
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
      });
      
      // Search by description
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      fireEvent.change(searchInput, { target: { value: 'Monthly sales' } });
      
      // Should show Sales Data (has matching description)
      expect(screen.getByText('Sales Data')).toBeInTheDocument();
      expect(screen.queryByText('Customer Data')).not.toBeInTheDocument();
    });
  });

  describe('Upload Functionality', () => {
    test('opens upload modal when upload button is clicked', async () => {
      renderWithProviders(<DatasetManager />);
      
      const uploadButton = screen.getByText('Upload Dataset');
      fireEvent.click(uploadButton);
      
      // Check if modal opens
      expect(screen.getByText('Upload New Dataset')).toBeInTheDocument();
      expect(screen.getByText('Choose a file')).toBeInTheDocument();
    });

    test('closes upload modal when cancel is clicked', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Open modal
      const uploadButton = screen.getByText('Upload Dataset');
      fireEvent.click(uploadButton);
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Modal should be closed
      expect(screen.queryByText('Upload New Dataset')).not.toBeInTheDocument();
    });

    test('handles file selection correctly', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Open modal
      const uploadButton = screen.getByText('Upload Dataset');
      fireEvent.click(uploadButton);
      
      // Mock file selection
      const fileInput = screen.getByLabelText('Choose a file');
      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Check if file name is displayed
      expect(screen.getByDisplayValue('test')).toBeInTheDocument(); // Name field
      expect(screen.getByDisplayValue('test.csv')).toBeInTheDocument(); // File name field
    });

    test('submits upload form successfully', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Open modal
      const uploadButton = screen.getByText('Upload Dataset');
      fireEvent.click(uploadButton);
      
      // Mock file selection
      const fileInput = screen.getByLabelText('Choose a file');
      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Add description
      const descriptionInput = screen.getByPlaceholderText('Enter dataset description...');
      fireEvent.change(descriptionInput, { target: { value: 'Test dataset' } });
      
      // Submit form
      const submitButton = screen.getByText('Upload Dataset');
      fireEvent.click(submitButton);
      
      // Check if upload service was called
      await waitFor(() => {
        expect(datasetService.uploadDataset).toHaveBeenCalledWith(
          file,
          'test',
          'Test dataset'
        );
      });
    });

    test('shows error when upload fails', async () => {
      // Mock upload failure
      (datasetService.uploadDataset as jest.Mock).mockRejectedValue(new Error('Upload failed'));
      
      // Mock alert
      window.alert = jest.fn();
      
      renderWithProviders(<DatasetManager />);
      
      // Open modal and submit
      const uploadButton = screen.getByText('Upload Dataset');
      fireEvent.click(uploadButton);
      
      const fileInput = screen.getByLabelText('Choose a file');
      const file = new File(['test data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const submitButton = screen.getByText('Upload Dataset');
      fireEvent.click(submitButton);
      
      // Check if error alert is shown
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Upload failed. Please try again.');
      });
    });
  });

  describe('Delete Functionality', () => {
    test('shows confirmation dialog when delete is clicked', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
      });
      
      // Find and click delete button (using a more specific selector)
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      // Check if confirm was called
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this dataset? This action cannot be undone.'
      );
    });

    test('deletes dataset when confirmed', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
      });
      
      // Mock alert
      window.alert = jest.fn();
      
      // Find and click delete button
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      // Check if delete service was called
      await waitFor(() => {
        expect(datasetService.deleteDataset).toHaveBeenCalledWith('dataset-1');
        expect(window.alert).toHaveBeenCalledWith('Dataset deleted successfully.');
      });
    });

    test('does not delete dataset when cancelled', async () => {
      // Mock confirm dialog (user cancels)
      window.confirm = jest.fn(() => false);
      
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
      });
      
      // Find and click delete button
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      // Check if delete service was NOT called
      expect(datasetService.deleteDataset).not.toHaveBeenCalled();
    });

    test('shows error when delete fails', async () => {
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      
      // Mock delete failure
      (datasetService.deleteDataset as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      
      // Mock alert
      window.alert = jest.fn();
      
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Sales Data')).toBeInTheDocument();
      });
      
      // Find and click delete button
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      // Check if error alert is shown
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete dataset. Please try again.');
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when dataset fetch fails', async () => {
      // Mock fetch failure
      (datasetService.getDatasets as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      // Mock alert
      window.alert = jest.fn();
      
      renderWithProviders(<DatasetManager />);
      
      // Check if error alert is shown
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to load datasets. Please try refreshing the page.');
      });
    });

    test('handles empty dataset list gracefully', async () => {
      // Mock empty dataset list
      (datasetService.getDatasets as jest.Mock).mockResolvedValue([]);
      
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('No datasets found')).toBeInTheDocument();
        expect(screen.getByText('Upload your first dataset to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Check for proper ARIA labels
      expect(screen.getByRole('heading', { name: 'Datasets' })).toBeInTheDocument();
      expect(screen.getByLabelText('Search datasets...')).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderWithProviders(<DatasetManager />);
      
      // Test tab navigation
      const searchInput = screen.getByPlaceholderText('Search datasets...');
      searchInput.focus();
      
      // Tab to upload button
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      
      const uploadButton = screen.getByText('Upload Dataset');
      expect(uploadButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('handles large dataset lists efficiently', async () => {
      // Mock large dataset list
      const largeDatasetList = Array.from({ length: 100 }, (_, i) => ({
        ...mockDatasets[0],
        id: `dataset-${i}`,
        name: `Dataset ${i}`,
      }));
      
      (datasetService.getDatasets as jest.Mock).mockResolvedValue(largeDatasetList);
      
      const startTime = performance.now();
      renderWithProviders(<DatasetManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Dataset 0')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});
