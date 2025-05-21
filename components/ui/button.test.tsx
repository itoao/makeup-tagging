import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button'; // Assuming button.tsx is in the same directory
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
  it('should render with default variant and size', () => {
    render(<Button>Default Button</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Default Button' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-primary text-primary-foreground'); // Default variant
    expect(buttonElement).toHaveClass('h-10 px-4 py-2'); // Default size
  });

  it('should render with specified variant and size', () => {
    render(<Button variant="destructive" size="sm">Destructive Small</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Destructive Small' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-destructive text-destructive-foreground'); // Destructive variant
    expect(buttonElement).toHaveClass('h-9 rounded-md px-3'); // Small size
  });

  it('should render with outline variant and large size', () => {
    render(<Button variant="outline" size="lg">Outline Large</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Outline Large' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('border border-input bg-background hover:bg-accent hover:text-accent-foreground'); // Outline variant
    expect(buttonElement).toHaveClass('h-11 rounded-md px-8'); // Large size
  });

  it('should render with ghost variant and icon size', () => {
    render(<Button variant="ghost" size="icon">Ghost Icon</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Ghost Icon' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('hover:bg-accent hover:text-accent-foreground'); // Ghost variant
    expect(buttonElement).toHaveClass('h-10 w-10'); // Icon size
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const linkElement = screen.getByRole('link', { name: 'Link Button' });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/test');
    // Check that default button classes are applied to the child
    expect(linkElement).toHaveClass('bg-primary text-primary-foreground');
    expect(linkElement).toHaveClass('h-10 px-4 py-2');
  });

  it('should apply disabled attribute correctly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Disabled Button' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toBeDisabled();
    expect(buttonElement).toHaveClass('disabled:opacity-50');
    expect(buttonElement).toHaveClass('disabled:pointer-events-none');
  });

  it('should apply additional class names', () => {
    render(<Button className="extra-class">Button with Extra Class</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Button with Extra Class' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('extra-class');
    // Check default variant classes are still applied
    expect(buttonElement).toHaveClass('bg-primary');
  });

  it('should pass other HTML attributes', () => {
    render(<Button type="submit" aria-label="Submit Form">Submit Button</Button>);
    // When aria-label is present, it becomes the accessible name
    const buttonElement = screen.getByRole('button', { name: 'Submit Form' });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveAttribute('type', 'submit');
    expect(buttonElement).toHaveAttribute('aria-label', 'Submit Form');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when disabled and clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled Click</Button>);
    const buttonElement = screen.getByRole('button', { name: 'Disabled Click' });
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
