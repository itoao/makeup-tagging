// hooks/use-toast.test.ts
import { renderHook, act } from '@testing-library/react';
import { useToast, reducer, type State, type Action, toast as globalToastFunc, TOAST_LIMIT as ACTUAL_TOAST_LIMIT_FROM_MODULE } from './use-toast';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TEST_TOAST_REMOVE_DELAY = 100;
// Use the actual TOAST_LIMIT from the module if exported and available, otherwise default.
// This helps reducer tests align with actual module behavior if TOAST_LIMIT is exported.
const EFFECTIVE_TOAST_LIMIT = typeof ACTUAL_TOAST_LIMIT_FROM_MODULE === 'number' && ACTUAL_TOAST_LIMIT_FROM_MODULE > 0 ? ACTUAL_TOAST_LIMIT_FROM_MODULE : 3;


vi.mock('./use-toast', async (importOriginal) => {
  const original = await importOriginal<typeof import('./use-toast')>();
  return {
    ...original,
    TOAST_REMOVE_DELAY: 100, // Override delay
    TOAST_LIMIT: original.TOAST_LIMIT, // Pass through the original TOAST_LIMIT.
                                      // Tests will use EFFECTIVE_TOAST_LIMIT for their logic.
  };
});

// Helper to ensure a clean slate for hook tests by dismissing all toasts
const forceCleanupHookToasts = () => {
    const { result } = renderHook(() => useToast());
    const toasts = result.current.toasts;
    if (toasts.length > 0) {
        act(() => {
            // Dismiss ALL toasts currently in state via the hook
            result.current.dismiss(); 
        });
        act(() => {
            // Advance by a large enough margin to clear all of them
            vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY * toasts.length);
        });
    }
    // Verify it's empty
    const finalCheckResult = renderHook(() => useToast());
    const finalCheckToasts = finalCheckResult.result.current.toasts;
    if (finalCheckToasts.length > 0) {
        // This is problematic, means state isn't clearing as expected.
        // console.warn(`Force cleanup: ${finalCheckToasts.length} toasts still remain after dismiss all.`);
        // One more attempt if needed
        act(() => {
            finalCheckResult.result.current.dismiss();
        });
        act(() => {
            vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY * finalCheckToasts.length);
        });
    }
};

describe('useToast and toast function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    forceCleanupHookToasts();
  });

  afterEach(() => {
    forceCleanupHookToasts();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('toast() function (globalToastFunc)', () => {
    it('should add a toast and return its id and control functions', () => {
      let toastControl: { id: string; dismiss: () => void; update: (props: any) => void; };
      act(() => {
        toastControl = globalToastFunc({ title: 'Test Toast' });
      });
      const { result: hookResult } = renderHook(() => useToast());
      expect(hookResult.current.toasts).toHaveLength(1);
      expect(hookResult.current.toasts[0].title).toBe('Test Toast');
      expect(hookResult.current.toasts[0].id).toBe(toastControl!.id);
    });

    it('should dismiss a toast using the dismiss function returned by toast()', () => {
      let toastControl: { id: string; dismiss: () => void; };
      act(() => {
        toastControl = globalToastFunc({ title: 'Dismiss Test' });
      });
      const { result, rerender } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        toastControl.dismiss();
      });
      rerender(); 
      expect(result.current.toasts[0].open).toBe(false);

      act(() => {
        vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY);
      });
      rerender();
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should update a toast using the update function returned by toast()', () => {
      let toastControl: { id: string; update: (props: any) => void; };
      act(() => {
        toastControl = globalToastFunc({ title: 'Initial Title' });
      });
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts[0].title).toBe('Initial Title');

      act(() => {
        toastControl.update({ title: 'Updated Title' });
      });
      expect(result.current.toasts[0].title).toBe('Updated Title');
    });
  });

  describe('useToast() hook', () => {
    it('should dismiss a single toast using dismiss(id) from useToast()', () => {
      forceCleanupHookToasts(); 
      let t1_id: string | undefined, t2_id: string | undefined;
      act(() => { t1_id = globalToastFunc({ title: 'Toast 1' })?.id; });
      act(() => { t2_id = globalToastFunc({ title: 'Toast 2' })?.id; });
      
      const { result, rerender } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        if (t1_id) result.current.dismiss(t1_id);
      });
      rerender();
      expect(result.current.toasts.find(t => t.id === t1_id)?.open).toBe(false);
      expect(result.current.toasts.find(t => t.id === t2_id)?.open).toBe(true);

      act(() => {
        vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY);
      });
      rerender();
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(t2_id);
    });

    it('should dismiss all toasts using dismiss() from useToast()', () => {
      forceCleanupHookToasts(); 
      act(() => { globalToastFunc({ title: 'Toast A' }); });
      act(() => { globalToastFunc({ title: 'Toast B' }); });
      const { result, rerender } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.dismiss(); 
      });
      rerender();
      expect(result.current.toasts.every(t => !t.open)).toBe(true);
      act(() => {
        vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY * 2); 
      });
      rerender();
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('TOAST_LIMIT (hook behavior)', () => {
    it('should respect TOAST_LIMIT', () => {
      forceCleanupHookToasts(); 
      const limit = EFFECTIVE_TOAST_LIMIT; 
      const toastsToAdd = limit + 2;
      
      for (let i = 0; i < toastsToAdd; i++) {
        act(() => { globalToastFunc({ title: `Toast ${i + 1}` }); });
      }
      
      const { result, rerender } = renderHook(() => useToast());
      expect(result.current.toasts.length).toBe(limit);

      const expectedTitles = [];
      for (let i = toastsToAdd - limit; i < toastsToAdd; i++) {
        expectedTitles.push(`Toast ${i + 1}`);
      }
      const finalTitles = result.current.toasts.map(t => t.title);
      expect(finalTitles).toEqual(expectedTitles);
      
      act(() => { 
        vi.advanceTimersByTime(TEST_TOAST_REMOVE_DELAY * toastsToAdd);
      });
      rerender();
      expect(result.current.toasts.length).toBe(limit);
    });
  });

  describe('reducer', () => {
    let state: State;
    const testSpecificToastLimit = EFFECTIVE_TOAST_LIMIT;

    beforeEach(() => {
      state = { toasts: [] }; 
    });

    it('ADD_TOAST: should add a toast', () => {
      const newToast = { id: '1', title: 'New', open: true, duration: 5000, onOpenChange: vi.fn() };
      const action: Action = { type: 'ADD_TOAST', toast: newToast, toastLimit: testSpecificToastLimit };
      state = reducer(state, action);
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].title).toBe('New');
    });

    it('ADD_TOAST: should respect toastLimit by removing the oldest toast', () => {
        const createToast = (id: string, title: string) => ({ id, title, open: true, duration: 5000, onOpenChange: vi.fn() });
        let tempState: State = { toasts: [] }; // Use a local state for this test to avoid interference
        
        for (let i = 0; i < testSpecificToastLimit; i++) {
            tempState = reducer(tempState, { type: 'ADD_TOAST', toast: createToast(`${i+1}`, `Toast ${i+1}`), toastLimit: testSpecificToastLimit });
        }
        expect(tempState.toasts).toHaveLength(testSpecificToastLimit); 
        expect(tempState.toasts.map(t => t.title)).toEqual(Array.from({length: testSpecificToastLimit}, (_, i) => `Toast ${i+1}`));

        tempState = reducer(tempState, { type: 'ADD_TOAST', toast: createToast(`${testSpecificToastLimit+1}`, `Toast ${testSpecificToastLimit+1}`), toastLimit: testSpecificToastLimit });
        expect(tempState.toasts).toHaveLength(testSpecificToastLimit); 
        
        const expectedTitles = [];
        for (let i = 1; i < testSpecificToastLimit + 1; i++) { 
            expectedTitles.push(`Toast ${i + 1}`);
        }
        expect(tempState.toasts.map(t => t.title)).toEqual(expectedTitles);
    });

    it('UPDATE_TOAST: should update a toast', () => {
      const initialToast = { id: '1', title: 'Initial', open: true, duration: 5000, onOpenChange: vi.fn() };
      state = reducer(state, { type: 'ADD_TOAST', toast: initialToast, toastLimit: testSpecificToastLimit });
      const action: Action = { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } };
      state = reducer(state, action);
      expect(state.toasts[0].title).toBe('Updated');
    });

    it('DISMISS_TOAST: should mark a toast as not open', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true, duration: 5000, onOpenChange: vi.fn() };
      state = reducer(state, { type: 'ADD_TOAST', toast: toast1, toastLimit: testSpecificToastLimit });
      const action: Action = { type: 'DISMISS_TOAST', toastId: '1' };
      state = reducer(state, action);
      expect(state.toasts[0].open).toBe(false);
    });
    
    it('DISMISS_TOAST: should mark all toasts as not open if toastId is undefined', () => {
        const toast1 = { id: '1', title: 'Toast 1', open: true, duration: 5000, onOpenChange: vi.fn() };
        const toast2 = { id: '2', title: 'Toast 2', open: true, duration: 5000, onOpenChange: vi.fn() };
        state = reducer(state, { type: 'ADD_TOAST', toast: toast1, toastLimit: testSpecificToastLimit });
        if (testSpecificToastLimit > 1) {
            state = reducer(state, { type: 'ADD_TOAST', toast: toast2, toastLimit: testSpecificToastLimit });
        }
        const currentLength = state.toasts.length;
        
        const action: Action = { type: 'DISMISS_TOAST' }; 
        state = reducer(state, action);
        expect(state.toasts.every(t => !t.open)).toBe(true);
        expect(state.toasts).toHaveLength(currentLength);
      });

    it('REMOVE_TOAST: should remove a toast', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true, duration: 5000, onOpenChange: vi.fn() }; 
      const toast2 = { id: '2', title: 'Toast 2', open: true, duration: 5000, onOpenChange: vi.fn() };
      let tempState: State = { toasts: [] };
      tempState = reducer(tempState, { type: 'ADD_TOAST', toast: toast1, toastLimit: testSpecificToastLimit });
      if (testSpecificToastLimit > 1) {
        tempState = reducer(tempState, { type: 'ADD_TOAST', toast: toast2, toastLimit: testSpecificToastLimit });
      }
      
      const initialLength = tempState.toasts.length;
      tempState.toasts = tempState.toasts.map(t => t.id === '1' ? { ...t, open: false } : t); 

      const action: Action = { type: 'REMOVE_TOAST', toastId: '1' };
      tempState = reducer(tempState, action);

      const toast1Exists = tempState.toasts.find(t => t.id === '1');
      const expectedLength = toast1Exists ? initialLength : Math.max(0, initialLength -1);
      
      expect(tempState.toasts).toHaveLength(expectedLength);
      expect(tempState.toasts.find(t => t.id === '1')).toBeUndefined();
    });

    it('REMOVE_TOAST: should remove all closed toasts if toastId is undefined', () => {
        const toast1 = { id: '1', title: 'Toast 1', open: true, duration: 5000, onOpenChange: vi.fn() }; 
        const toast2 = { id: '2', title: 'Toast 2', open: true, duration: 5000, onOpenChange: vi.fn() };  
        const toast3 = { id: '3', title: 'Toast 3', open: true, duration: 5000, onOpenChange: vi.fn() }; 
        
        let tempState: State = { toasts: [] };
        tempState = reducer(tempState, { type: 'ADD_TOAST', toast: toast1, toastLimit: testSpecificToastLimit });
        tempState = reducer(tempState, { type: 'ADD_TOAST', toast: toast2, toastLimit: testSpecificToastLimit });
        tempState = reducer(tempState, { type: 'ADD_TOAST', toast: toast3, toastLimit: testSpecificToastLimit });
        
        const openToastIds: string[] = [];
        if (tempState.toasts.length > 0) openToastIds.push(tempState.toasts[0].id); 

        tempState.toasts = tempState.toasts.map(t => !openToastIds.includes(t.id) ? { ...t, open: false } : t); 
        const expectedRemainingCount = tempState.toasts.filter(t => t.open).length;
        
        const action: Action = { type: 'REMOVE_TOAST' }; 
        tempState = reducer(tempState, action);
        
        expect(tempState.toasts).toHaveLength(expectedRemainingCount); 
        if (expectedRemainingCount > 0 && openToastIds.length > 0) {
            expect(tempState.toasts.every(t => t.open)).toBe(true);
            expect(tempState.toasts.find(t => t.id === openToastIds[0])).toBeDefined();
        }
      });
  });
});
