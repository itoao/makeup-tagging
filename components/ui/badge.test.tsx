import { render, screen } from '@testing-library/react';
import { Badge } from './badge'; // Assuming badge.tsx is in the same directory
import { describe, it, expect } from 'vitest';

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badgeElement = screen.getByText('Default Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('bg-primary');
    expect(badgeElement).toHaveClass('hover:bg-primary/80');
    expect(badgeElement).toHaveClass('border-transparent');
    expect(badgeElement).toHaveClass('text-primary-foreground');
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badgeElement = screen.getByText('Secondary Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('bg-secondary');
    expect(badgeElement).toHaveClass('hover:bg-secondary/80');
    expect(badgeElement).toHaveClass('border-transparent');
    expect(badgeElement).toHaveClass('text-secondary-foreground');
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badgeElement = screen.getByText('Destructive Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('bg-destructive');
    expect(badgeElement).toHaveClass('hover:bg-destructive/80');
    expect(badgeElement).toHaveClass('border-transparent');
    expect(badgeElement).toHaveClass('text-destructive-foreground');
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badgeElement = screen.getByText('Outline Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('text-foreground');
    // Outline variant does not have background or hover:bg classes by default from badgeVariants
    expect(badgeElement).not.toHaveClass('bg-primary');
    expect(badgeElement).not.toHaveClass('hover:bg-primary/80');
  });

  it('should apply additional class names', () => {
    render(<Badge className="extra-class">Badge with Extra Class</Badge>);
    const badgeElement = screen.getByText('Badge with Extra Class');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('extra-class');
    // Check default variant classes are still applied
    expect(badgeElement).toHaveClass('bg-primary');
  });

  it('should pass other HTML attributes', () => {
    render(<Badge id="my-badge" aria-label="important badge">Badge with Attributes</Badge>);
    const badgeElement = screen.getByText('Badge with Attributes');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveAttribute('id', 'my-badge');
    expect(badgeElement).toHaveAttribute('aria-label', 'important badge');
  });

  it('should render children correctly', () => {
    render(<Badge><span>Child Span</span></Badge>);
    const childElement = screen.getByText('Child Span');
    expect(childElement).toBeInTheDocument();
    expect(childElement.tagName).toBe('SPAN');
    const badgeElement = childElement.parentElement;
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement?.tagName).toBe('DIV');
    // Optionally, check if the badge has its default classes
    expect(badgeElement).toHaveClass('bg-primary');
  });
});
