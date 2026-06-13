// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BarcodeScanner from '@/components/BarcodeScanner';

// Mock html5-qrcode — use vi.hoisted so variables are available in vi.mock factory
// IMPORTANT: use a regular function (not arrow) so it can be used with `new`
const { mockStart, mockStop, MockHtml5Qrcode } = vi.hoisted(() => {
  const start = vi.fn();
  const stop = vi.fn();
  function Ctor() {
    return { start, stop };
  }
  return { mockStart: start, mockStop: stop, MockHtml5Qrcode: vi.fn(Ctor) };
});

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: MockHtml5Qrcode,
}));

function renderScanner(props?: { onScan?: (barcode: string) => void; onError?: (error: string) => void }) {
  return render(
    <BarcodeScanner
      onScan={props?.onScan ?? vi.fn()}
      onError={props?.onError}
    />
  );
}

describe('BarcodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the barcode reader container', () => {
      renderScanner();
      expect(document.getElementById('barcode-reader')).toBeInTheDocument();
    });

    it('should show "Start Scanning" button initially', () => {
      renderScanner();
      expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('should not show "Stop Scanning" button initially', () => {
      renderScanner();
      expect(screen.queryByText('Stop Scanning')).not.toBeInTheDocument();
    });

    it('should not show camera error initially', () => {
      renderScanner();
      expect(screen.queryByText(/Camera access failed/)).not.toBeInTheDocument();
    });
  });

  describe('start scanning', () => {
    it('should hide Start button and show Stop button when scanning starts', async () => {
      renderScanner();
      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
      });
      expect(screen.queryByText('Start Scanning')).not.toBeInTheDocument();
    });

    it('should call Html5Qrcode.start with camera config', async () => {
      renderScanner();
      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledWith(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 1.5 },
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    it('should call onScan when barcode is detected', async () => {
      const onScan = vi.fn();
      renderScanner({ onScan });

      // Capture the success callback from mockStart
      let successCallback: ((decodedText: string) => void) | undefined;
      mockStart.mockImplementation(async (_constraints, _options, onSuccess) => {
        successCallback = onSuccess;
        return undefined;
      });

      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Simulate barcode detection
      successCallback!('8901234567890');
      await waitFor(() => {
        expect(onScan).toHaveBeenCalledWith('8901234567890');
      });
    });

    it('should only call onScan once per scan session (one-shot lock)', async () => {
      const onScan = vi.fn();
      renderScanner({ onScan });

      let successCallback: ((decodedText: string) => void) | undefined;
      mockStart.mockImplementation(async (_constraints, _options, onSuccess) => {
        successCallback = onSuccess;
        return undefined;
      });

      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      // Simulate multiple rapid barcode detections (html5-qrcode fires per frame)
      successCallback!('8901234567890');
      successCallback!('8901234567890');
      successCallback!('8901234567890');

      await waitFor(() => {
        expect(onScan).toHaveBeenCalledTimes(1);
      });
    });

    it('should show camera error when start fails', async () => {
      const onError = vi.fn();
      mockStart.mockRejectedValue(new Error('Camera permission denied'));

      renderScanner({ onError });
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByText('Camera permission denied')).toBeInTheDocument();
      });
      expect(onError).toHaveBeenCalledWith('Camera permission denied');
    });

    it('should show generic error when start fails with non-Error', async () => {
      mockStart.mockRejectedValue('unknown error');

      renderScanner();
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByText('Camera access failed')).toBeInTheDocument();
      });
    });
  });

  describe('stop scanning', () => {
    it('should hide Stop button and show Start button when stopped', async () => {
      renderScanner();

      // Start scanning
      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
      });

      // Stop scanning
      fireEvent.click(screen.getByText('Stop Scanning'));
      await waitFor(() => {
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
      });
      expect(screen.queryByText('Stop Scanning')).not.toBeInTheDocument();
    });

    it('should call Html5Qrcode.stop when stop button is clicked', async () => {
      renderScanner();

      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stop Scanning'));
      await waitFor(() => {
        expect(mockStop).toHaveBeenCalled();
      });
    });
  });

  describe('error recovery', () => {
    it('should show Try again button after camera error', async () => {
      mockStart.mockRejectedValue(new Error('Camera access denied'));

      renderScanner();
      fireEvent.click(screen.getByText('Start Scanning'));

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });
    });

    it('should clear error and retry when Try again is clicked', async () => {
      mockStart
        .mockRejectedValueOnce(new Error('Camera access denied'))
        .mockResolvedValueOnce(undefined);

      renderScanner();

      // First attempt fails
      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });

      // Retry succeeds
      fireEvent.click(screen.getByText('Try again'));
      await waitFor(() => {
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
      });
      expect(screen.queryByText('Camera access denied')).not.toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('should stop scanner on unmount', async () => {
      const { unmount } = renderScanner();

      fireEvent.click(screen.getByText('Start Scanning'));
      await waitFor(() => {
        expect(mockStart).toHaveBeenCalled();
      });

      unmount();
      // stop may be called during cleanup
      expect(mockStop).toHaveBeenCalled();
    });
  });
});
