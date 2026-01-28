// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gestionar usuarios con filtros y búsqueda
 */
export function useUsers(filters = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    includeInactive = false,
    departmentId = null,
    role = null,
    searchTerm = ''
  } = filters;

  useEffect(() => {
    loadUsers();
  }, [includeInactive, departmentId, role, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;

      if (searchTerm && searchTerm.trim().length > 0) {
        const { data: searchData, error: searchError } = await supabase
          .rpc('search_users', {
            p_search_term: searchTerm.trim(),
            p_department_id: departmentId,
            p_role: role,
            p_include_inactive: includeInactive,
            p_limit: 50
          });

        if (searchError) throw searchError;
        data = searchData;
      } else {
        const { data: listData, error: listError } = await supabase
          .rpc('get_users_list', {
            p_include_inactive: includeInactive,
            p_department_id: departmentId,
            p_role: role
          });

        if (listError) throw listError;
        data = listData;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    refresh: loadUsers
  };
}