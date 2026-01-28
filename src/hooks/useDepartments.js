// src/hooks/useDepartments.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para obtener lista de departamentos
 */
export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: deptError } = await supabase
        .from('department')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (deptError) throw deptError;
      
      setDepartments(data || []);
    } catch (err) {
      console.error('❌ Error loading departments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    departments, 
    loading, 
    error,
    refresh: loadDepartments
  };
}