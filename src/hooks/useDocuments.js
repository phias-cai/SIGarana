// src/hooks/useDocuments.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para gestionar documentos con filtros, búsqueda y estadísticas
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.searchTerm - Término de búsqueda
 * @param {string} filters.documentTypeId - ID del tipo de documento
 * @param {string} filters.processId - ID del proceso
 * @param {string} filters.status - Estado del documento
 * @param {boolean} filters.includeInactive - Incluir documentos inactivos
 */
export function useDocuments(filters = {}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {
      draft: 0,
      pending_approval: 0,
      published: 0,
      archived: 0
    },
    byProcess: {}
  });

  const {
    searchTerm = '',
    documentTypeId = null,
    processId = null,
    status = null,
    includeInactive = false
  } = filters;

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, documentTypeId, processId, status, includeInactive]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query base
      let query = supabase
        .from('document')
        .select(`
          *,
          document_type:document_type_id (
            id,
            code,
            name,
            prefix
          ),
          process:process_id (
            id,
            code,
            name
          ),
          responsible:created_by (
            id,
            full_name,
            email
          )
        `)
        .order('process_id', { ascending: true })
        .order('code', { ascending: true });

      // Aplicar filtros
      if (documentTypeId) {
        query = query.eq('document_type_id', documentTypeId);
      }

      if (processId) {
        query = query.eq('process_id', processId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Búsqueda por texto (código, nombre)
      if (searchTerm) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calcular estadísticas
      const newStats = {
        total: data.length,
        byStatus: {
          draft: data.filter(d => d.status === 'draft').length,
          pending_approval: data.filter(d => d.status === 'pending_approval').length,
          published: data.filter(d => d.status === 'published').length,
          archived: data.filter(d => d.status === 'archived').length
        },
        byProcess: {}
      };

      // Agrupar por proceso
      data.forEach(doc => {
        const processCode = doc.process?.code || 'Sin proceso';
        if (!newStats.byProcess[processCode]) {
          newStats.byProcess[processCode] = {
            name: doc.process?.name || 'Sin proceso',
            count: 0,
            documents: []
          };
        }
        newStats.byProcess[processCode].count++;
        newStats.byProcess[processCode].documents.push(doc);
      });

      setDocuments(data);
      setStats(newStats);

    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadDocuments();
  };

  return {
    documents,
    loading,
    error,
    stats,
    refresh
  };
}

/**
 * Hook para obtener tipos de documentos
 */
export function useDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('document_type')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (fetchError) throw fetchError;
      setDocumentTypes(data || []);
    } catch (err) {
      console.error('Error loading document types:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { documentTypes, loading, error };
}

/**
 * Hook para obtener procesos
 */
export function useProcesses() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('process')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (fetchError) throw fetchError;
      setProcesses(data || []);
    } catch (err) {
      console.error('Error loading processes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { processes, loading, error };
}

/**
 * Hook para gestionar un documento individual
 */
export function useDocument(documentId) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('document')
        .select(`
          *,
          document_type:document_type_id (*),
          process:process_id (*),
          responsible:created_by (*),
          versions:document_version (*),
          approvals:document_approval (*)
        `)
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;
      setDocument(data);
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('document')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setDocument(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating document:', err);
      return { success: false, error: err.message };
    }
  };

  const approveDocument = async () => {
    return await updateDocument({ 
      status: 'published',
      updated_at: new Date().toISOString()
    });
  };

  const rejectDocument = async (reason) => {
    return await updateDocument({ 
      status: 'draft',
      change_reason: reason,
      updated_at: new Date().toISOString()
    });
  };

  return {
    document,
    loading,
    error,
    updateDocument,
    approveDocument,
    rejectDocument,
    refresh: loadDocument
  };
}