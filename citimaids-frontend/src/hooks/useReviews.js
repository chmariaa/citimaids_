import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * useReviews — fetches publicly-approved reviews from the API.
 * Falls back to an empty array so the page always renders gracefully.
 */
export function useReviews() {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    api.get('/reviews')
      .then(({ data }) => {
        setReviews(data);
        setError(null);
      })
      .catch((err) => {
        console.warn('useReviews fetch error:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  /**
   * submitReview — posts a new review (status = pending) and returns the response.
   * The homepage can call this from the modal form.
   */
  const submitReview = useCallback(async (payload) => {
    const { data } = await api.post('/reviews', payload);
    return data;
  }, []);

  return { reviews, loading, error, refetch: fetchReviews, submitReview };
}
