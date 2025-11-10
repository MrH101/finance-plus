import { describe, it, expect } from 'vitest';
import uiReducer, {
  toggleSidebar,
  setTheme,
  setLoading,
} from '../store/slices/uiSlice';

describe('UI Slice', () => {
  const initialState = {
    sidebarOpen: false,
    theme: 'light' as const,
    loading: false,
  };

  it('should handle initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle toggleSidebar', () => {
    const state = uiReducer(initialState, toggleSidebar());
    expect(state.sidebarOpen).toBe(true);

    const nextState = uiReducer(state, toggleSidebar());
    expect(nextState.sidebarOpen).toBe(false);
  });

  it('should handle setTheme', () => {
    const state = uiReducer(initialState, setTheme('dark'));
    expect(state.theme).toBe('dark');

    const nextState = uiReducer(state, setTheme('light'));
    expect(nextState.theme).toBe('light');
  });

  it('should handle setLoading', () => {
    const state = uiReducer(initialState, setLoading(true));
    expect(state.loading).toBe(true);

    const nextState = uiReducer(state, setLoading(false));
    expect(nextState.loading).toBe(false);
  });

  it('should preserve other state properties when updating one property', () => {
    const state = {
      ...initialState,
      sidebarOpen: true,
      theme: 'dark' as const,
    };

    const nextState = uiReducer(state, setLoading(true));
    expect(nextState).toEqual({
      sidebarOpen: true,
      theme: 'dark',
      loading: true,
    });
  });
}); 