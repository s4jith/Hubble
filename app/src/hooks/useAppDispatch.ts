import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * Typed dispatch hook for async thunks
 * Use this instead of plain useDispatch() for proper typing with async actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook
 * Use this instead of plain useSelector() for proper typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
