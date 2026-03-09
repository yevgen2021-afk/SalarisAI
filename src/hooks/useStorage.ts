import { useState, useCallback } from 'react';

// A custom hook to manage state that syncs with localStorage
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue instanceof Function ? initialValue() : initialValue;
      
      try {
        return JSON.parse(item) as T;
      } catch (e) {
        // Fallback for plain strings (e.g., 'dark', 'sky') from previous versions
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => readValue());

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(value => {
    setStoredValue(prev => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(prev) : value;
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
        return prev;
      }
    });
  }, [key]);

  return [storedValue, setValue];
}
