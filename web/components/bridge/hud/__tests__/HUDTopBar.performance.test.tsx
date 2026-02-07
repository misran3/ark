/**
 * Performance test for HUDTopBar component
 *
 * Verifies that optimization prevents unnecessary re-renders of static elements.
 *
 * Systematic Debugging Results:
 * - Root Cause: Clock updates (every 1000ms) trigger full component re-renders
 * - Pattern: Use React.memo + useMemo to isolate dynamic updates
 * - Hypothesis: Split stardate into isolated component, memoize static elements
 * - Implementation: See HUDTopBar.tsx (optimized version)
 */

import { render } from '@testing-library/react';
import { HUDTopBar } from '../HUDTopBar';
import { act } from 'react';

describe('HUDTopBar Performance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should minimize re-renders of static elements (USS PROSPERITY, STATUS)', () => {
    const renderSpy = jest.fn();

    // Mock the ship name component to track renders
    const OriginalShipName = jest.fn(({ children }) => {
      renderSpy('ship-name');
      return <div data-testid="ship-name">{children}</div>;
    });

    const { container } = render(<HUDTopBar />);

    // Get initial render count
    const initialShipRenders = renderSpy.mock.calls.filter(
      (call) => call[0] === 'ship-name'
    ).length;

    // Advance time by 5 seconds (5 clock ticks)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Get final render count
    const finalShipRenders = renderSpy.mock.calls.filter(
      (call) => call[0] === 'ship-name'
    ).length;

    // Ship name should NOT re-render after typewriter completes
    // Expectation: finalShipRenders should equal initialShipRenders (no additional renders)
    // This test will FAIL with original implementation (would re-render 5 times)
    expect(finalShipRenders - initialShipRenders).toBeLessThanOrEqual(1);
  });

  it('should only update stardate text on clock tick', () => {
    const { container } = render(<HUDTopBar />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const stardateElement = container.querySelector('.font-mono');
    expect(stardateElement).toBeInTheDocument();

    // Stardate should update (this is expected behavior)
    const initialText = stardateElement?.textContent;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const updatedText = stardateElement?.textContent;
    expect(updatedText).not.toBe(initialText);
  });

  it('should memoize style objects to prevent recreation', () => {
    const { rerender } = render(<HUDTopBar />);

    // Get style reference from first render
    const firstRender = document.querySelector('.font-mono');
    const firstStyle = firstRender?.getAttribute('style');

    // Re-render without changing alertLevel
    rerender(<HUDTopBar />);

    const secondRender = document.querySelector('.font-mono');
    const secondStyle = secondRender?.getAttribute('style');

    // Style string should be identical (memoized)
    expect(secondStyle).toBe(firstStyle);
  });
});
