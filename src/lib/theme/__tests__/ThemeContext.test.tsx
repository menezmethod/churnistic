import { render, screen, fireEvent, act } from '@testing-library/react';

import { useTheme, ThemeProvider } from '../ThemeContext';

// Mock component to test useTheme hook
function TestComponent(): JSX.Element {
  const { mode, setMode } = useTheme();

  return (
    <div>
      <div data-testid="theme-mode">{mode}</div>
      <button onClick={(): void => setMode('light')}>Set Light</button>
      <button onClick={(): void => setMode('dark')}>Set Dark</button>
      <button onClick={(): void => setMode('system')}>Set System</button>
    </div>
  );
}

describe('ThemeContext', () => {
  const mockMatchMedia = (matches: boolean): void => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  beforeEach(() => {
    mockMatchMedia(false); // Default to light mode
  });

  it('provides default theme mode as system', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('system');
  });

  it('allows changing theme mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');

    fireEvent.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('detects system theme changes', () => {
    let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

    // Mock addEventListener to capture the callback
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, cb) => {
        mediaQueryCallback = cb;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Simulate system theme change
    act(() => {
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: true } as MediaQueryListEvent);
      }
    });

    // Since we're using system theme, it should reflect the system's dark mode
    const themeMode = screen.getByTestId('theme-mode');
    expect(themeMode).toHaveTextContent('system');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('respects defaultMode prop', () => {
    render(
      <ThemeProvider defaultMode="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('maintains theme mode after system theme changes', () => {
    let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, cb) => {
        mediaQueryCallback = cb;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Set explicit theme mode
    fireEvent.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');

    // Simulate system theme change
    act(() => {
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: true } as MediaQueryListEvent);
      }
    });

    // Theme should remain light despite system change
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener,
      dispatchEvent: jest.fn(),
    }));

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
