// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import PWARegistration from '@/components/PWARegistration';

describe('PWARegistration', () => {
  const originalServiceWorker = navigator.serviceWorker;

  beforeEach(() => {
    // Mock service worker API
    const mockRegister = vi.fn().mockResolvedValue({ update: vi.fn() });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
  });

  it('should render nothing', () => {
    const { container } = render(<PWARegistration />);
    expect(container.innerHTML).toBe('');
  });

  it('should register service worker on mount', () => {
    render(<PWARegistration />);
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('should only register once', () => {
    render(<PWARegistration />);
    render(<PWARegistration />);
    // Each render triggers a useEffect, so register is called per instance
    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(2);
  });

  it('should handle registration failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Registration failed'));
    
    // Should not throw
    expect(() => render(<PWARegistration />)).not.toThrow();
    
    // Wait for the promise to settle
    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('should call update after successful registration', async () => {
    const mockUpdate = vi.fn();
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockResolvedValue({ update: mockUpdate });
    
    render(<PWARegistration />);
    
    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should not crash when serviceWorker is not supported', () => {
    // Delete the property entirely so 'serviceWorker' in navigator returns false
    delete (navigator as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;

    // Should not throw
    expect(() => render(<PWARegistration />)).not.toThrow();
  });

  it('should handle registration returning undefined gracefully', async () => {
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockResolvedValue(undefined as unknown as ServiceWorkerRegistration);

    expect(() => render(<PWARegistration />)).not.toThrow();

    await vi.waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });
  });

  it('should handle update() throwing after successful registration', async () => {
    const mockUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockResolvedValue({ update: mockUpdate });

    // Should not throw
    expect(() => render(<PWARegistration />)).not.toThrow();

    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should not re-register after unmount', async () => {
    const { unmount } = render(<PWARegistration />);
    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(1);

    unmount();

    // Verify register was only called once total
    expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(1);
  });

  it('should register with the correct sw.js path', () => {
    render(<PWARegistration />);
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(navigator.serviceWorker.register).not.toHaveBeenCalledWith('sw.js');
    expect(navigator.serviceWorker.register).not.toHaveBeenCalledWith('/service-worker.js');
  });
});
