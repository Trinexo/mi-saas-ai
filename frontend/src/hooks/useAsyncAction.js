import { useState } from 'react';
import { getErrorMessage } from '../services/api';

export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const clearError = () => {
    setError('');
  };

  const clearMessage = () => {
    setMessage('');
  };

  const setErrorMessage = (value, fallback) => {
    setError(getErrorMessage(value, fallback));
  };

  const setSuccessMessage = (value) => {
    setMessage(typeof value === 'string' ? value : 'Operación completada');
  };

  const runAction = async (action, fallbackMessage) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      return await action();
    } catch (errorValue) {
      setError(getErrorMessage(errorValue, fallbackMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    error,
    message,
    isLoading,
    clearError,
    clearMessage,
    setErrorMessage,
    setSuccessMessage,
    runAction,
  };
}
