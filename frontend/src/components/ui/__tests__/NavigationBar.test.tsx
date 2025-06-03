import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import NavigationBar from '../NavigationBar';

// Next.js navigation mocks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('NavigationBar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders logo and navigation items correctly', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<NavigationBar />);
    
    expect(screen.getByText('🂡 Manta')).toBeInTheDocument();
    expect(screen.getByText('ゲーム')).toBeInTheDocument();
    expect(screen.getByText('履歴')).toBeInTheDocument();
    expect(screen.getByText('4人対戦ハーツゲーム')).toBeInTheDocument();
  });

  it('highlights home navigation when on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<NavigationBar />);
    
    const gameLink = screen.getByText('ゲーム').closest('a');
    const historyLink = screen.getByText('履歴').closest('a');
    
    expect(gameLink).toHaveClass('bg-blue-100', 'text-blue-700');
    expect(historyLink).not.toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('highlights history navigation when on history page', () => {
    mockUsePathname.mockReturnValue('/history');
    
    render(<NavigationBar />);
    
    const gameLink = screen.getByText('ゲーム').closest('a');
    const historyLink = screen.getByText('履歴').closest('a');
    
    expect(gameLink).not.toHaveClass('bg-blue-100', 'text-blue-700');
    expect(historyLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('highlights history navigation when on game detail page', () => {
    mockUsePathname.mockReturnValue('/history/123');
    
    render(<NavigationBar />);
    
    const gameLink = screen.getByText('ゲーム').closest('a');
    const historyLink = screen.getByText('履歴').closest('a');
    
    expect(gameLink).not.toHaveClass('bg-blue-100', 'text-blue-700');
    expect(historyLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });
});