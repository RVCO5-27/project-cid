import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

// Mock api service
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../context/AuthContext';

const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  const mockUser = {
    username: 'testadmin',
    full_name: 'Test Administrator',
    email: 'admin@test.com',
    role: 'admin',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  const mockSuperAdmin = {
    ...mockUser,
    role: 'SuperAdmin',
    full_name: 'Super Admin User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the correct user name when user data is provided', () => {
    useAuth.mockReturnValue({ user: mockUser, logout: jest.fn() });
    renderWithRouter(<Header adminArea={true} />);
    
    expect(screen.getByText('Test Administrator')).toBeInTheDocument();
  });

  test('avatar image displays correctly when a valid image URL is supplied', () => {
    useAuth.mockReturnValue({ user: mockUser, logout: jest.fn() });
    renderWithRouter(<Header adminArea={true} />);
    
    const avatarImg = screen.getByAltText('Test Administrator');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg.src).toBe('https://example.com/avatar.jpg');
  });

  test('fallback generic person icon appears when the image URL is missing', () => {
    const userNoAvatar = { ...mockUser, avatar_url: null };
    useAuth.mockReturnValue({ user: userNoAvatar, logout: jest.fn() });
    renderWithRouter(<Header adminArea={true} />);
    
    // The placeholder shows the first character of the name
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('tooltip showing "Logged in as {full_name}" is present', () => {
    useAuth.mockReturnValue({ user: mockUser, logout: jest.fn() });
    renderWithRouter(<Header adminArea={true} />);
    
    const profileSection = screen.getByLabelText('User Profile Menu');
    expect(profileSection).toHaveAttribute('title', 'Logged in as Test Administrator');
  });

  test('displays distinct visual indicators for main admin', () => {
    useAuth.mockReturnValue({ user: mockSuperAdmin, logout: jest.fn() });
    renderWithRouter(<Header adminArea={true} />);
    
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  test('maintains accessibility standards', () => {
    useAuth.mockReturnValue({ user: mockUser, logout: jest.fn() });
    const { container } = renderWithRouter(<Header adminArea={true} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('User Profile Menu')).toBeInTheDocument();
  });
});
