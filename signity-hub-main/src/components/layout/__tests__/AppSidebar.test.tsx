import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppSidebar } from '../AppSidebar';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the auth store
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN'
};

const mockLogout = jest.fn();

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      user: mockUser,
      logout: mockLogout,
    };
    return selector(state);
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Admin Navigation', () => {
    test('should display departments link as enabled for admin users', () => {
      renderWithRouter(<AppSidebar />);
      
      const departmentsLink = screen.getByRole('link', { name: /departments/i });
      expect(departmentsLink).toBeDefined();
      expect(departmentsLink.getAttribute('href')).toBe('/admin/departments');
      
      // Should not have cursor-not-allowed class (which indicates disabled state)
      expect(departmentsLink.className).not.toContain('cursor-not-allowed');
    });

    test('should not show "Soon" text for departments link', () => {
      renderWithRouter(<AppSidebar />);
      
      const departmentsText = screen.getByText('Departments');
      expect(departmentsText).toBeDefined();
      
      // Check that departments link doesn't have "(Soon)" by checking its parent
      const departmentsParent = departmentsText.closest('a');
      expect(departmentsParent?.textContent).not.toContain('(Soon)');
    });

    test('should include all expected admin navigation items', () => {
      renderWithRouter(<AppSidebar />);
      
      expect(screen.getByRole('link', { name: /^dashboard$/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /^members$/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /invite members/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /^departments$/i })).toBeDefined();
      
      // Settings should still be disabled (has "Soon" text)
      expect(screen.getByText('Settings')).toBeDefined();
      expect(screen.getByText('(Soon)')).toBeDefined();
    });
  });
});