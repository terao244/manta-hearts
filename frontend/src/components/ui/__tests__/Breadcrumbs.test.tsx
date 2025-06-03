import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders single breadcrumb item without link', () => {
    const items = [{ label: 'Home' }];
    
    render(<Breadcrumbs items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Home').tagName).toBe('SPAN');
  });

  it('renders multiple breadcrumb items with proper links', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'History', href: '/history' },
      { label: 'Game #123' }
    ];
    
    render(<Breadcrumbs items={items} />);
    
    const homeLink = screen.getByText('Home');
    const historyLink = screen.getByText('History');
    const gameText = screen.getByText('Game #123');
    
    expect(homeLink.tagName).toBe('A');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    
    expect(historyLink.tagName).toBe('A');
    expect(historyLink.closest('a')).toHaveAttribute('href', '/history');
    
    expect(gameText.tagName).toBe('SPAN');
  });

  it('renders chevron icons between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'History', href: '/history' },
      { label: 'Game #123' }
    ];
    
    const { container } = render(<Breadcrumbs items={items} />);
    
    const svgElements = container.querySelectorAll('svg');
    // Should have 2 chevron icons for 3 items
    expect(svgElements).toHaveLength(2);
  });

  it('applies correct CSS classes to links and text', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Current Page' }
    ];
    
    render(<Breadcrumbs items={items} />);
    
    const homeLink = screen.getByText('Home');
    const currentText = screen.getByText('Current Page');
    
    expect(homeLink).toHaveClass('text-blue-600', 'hover:text-blue-800');
    expect(currentText).toHaveClass('text-gray-900');
  });
});