// =====================================================
// HOOK: useDocumentCode
// =====================================================
// Descripción: Hook para obtener y gestionar códigos de documentos
//
// Funcionalidades:
// - Obtener siguiente código consecutivo automático
// - Validar formato de código manual
// - Verificar si un código ya existe
// =====================================================

import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gestión de códigos de documentos
 * 
 * @returns {Object} Funciones y estado para códigos de documentos
 */
export const useDocumentCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene el siguiente código consecutivo disponible
   * 
   * @param {string} documentType - Tipo de documento (PR, RE, IN, MN, GU, FO)
   * @param {string} department - Código de departamento (DP, GS, GC, GP, GR, GH)
   * @returns {Promise<string|null>} Siguiente código o null si hay error
   * 
   * @example
   * const nextCode = await getNextCode('RE', 'GS');
   * // Retorna: "RE-GS-33"
   */
  const getNextCode = async (documentType, department) => {
    try {
      setLoading(true);
      setError(null);

      // Validar parámetros
      if (!documentType || !department) {
        throw new Error('Tipo de documento y departamento son requeridos');
      }

      // Llamar a la función SQL de Supabase
      const { data, error } = await supabase.rpc('get_next_document_code', {
        p_document_type: documentType.trim().toUpperCase(),
        p_department: department.trim().toUpperCase()
      });

      if (error) throw error;

      console.log(`✅ Siguiente código generado: ${data}`);
      return data;

    } catch (err) {
      console.error('❌ Error al obtener siguiente código:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica si un código de documento ya existe
   * 
   * @param {string} code - Código a verificar (ej: "RE-GS-33")
   * @returns {Promise<boolean>} true si existe, false si no existe
   * 
   * @example
   * const exists = await checkCodeExists('RE-GS-01');
   * // Retorna: true o false
   */
  const checkCodeExists = async (code) => {
    try {
      setLoading(true);
      setError(null);

      if (!code) {
        throw new Error('Código es requerido');
      }

      const { data, error } = await supabase
        .from('document')
        .select('id')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      return !!data; // Retorna true si existe

    } catch (err) {
      console.error('❌ Error al verificar código:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valida el formato de un código de documento
   * 
   * @param {string} code - Código a validar
   * @returns {Object} { valid: boolean, message: string }
   * 
   * @example
   * const validation = validateCodeFormat('RE-GS-33');
   * // Retorna: { valid: true, message: 'Código válido' }
   */
  const validateCodeFormat = (code) => {
    if (!code) {
      return { valid: false, message: 'El código es requerido' };
    }

    // Formato esperado: XX-YY-NN (ej: RE-GS-33)
    const regex = /^[A-Z]{2,3}-[A-Z]{2}-\d{2}$/;
    
    if (!regex.test(code.trim().toUpperCase())) {
      return { 
        valid: false, 
        message: 'Formato inválido. Debe ser XX-YY-NN (ej: RE-GS-01)' 
      };
    }

    return { valid: true, message: 'Código válido' };
  };

  /**
   * Extrae las partes de un código de documento
   * 
   * @param {string} code - Código a parsear (ej: "RE-GS-33")
   * @returns {Object|null} { type, department, number } o null si inválido
   * 
   * @example
   * const parts = parseCode('RE-GS-33');
   * // Retorna: { type: 'RE', department: 'GS', number: 33 }
   */
  const parseCode = (code) => {
    if (!code) return null;

    const match = code.trim().toUpperCase().match(/^([A-Z]{2,3})-([A-Z]{2})-(\d{2})$/);
    
    if (!match) return null;

    return {
      type: match[1],      // 'RE'
      department: match[2], // 'GS'
      number: parseInt(match[3], 10) // 33
    };
  };

  return {
    getNextCode,
    checkCodeExists,
    validateCodeFormat,
    parseCode,
    loading,
    error
  };
};

// =====================================================
// EJEMPLOS DE USO
// =====================================================

/*
import { useDocumentCode } from '../hooks/useDocumentCode';

function FormularioCreacion() {
  const { getNextCode, checkCodeExists, validateCodeFormat } = useDocumentCode();

  // Obtener siguiente código automático
  const handleGenerateCode = async () => {
    const nextCode = await getNextCode('RE', 'GS');
    console.log(nextCode); // "RE-GS-33"
  };

  // Verificar si código existe
  const handleCheckCode = async (code) => {
    const exists = await checkCodeExists(code);
    if (exists) {
      alert('Este código ya existe');
    }
  };

  // Validar formato
  const handleValidate = (code) => {
    const { valid, message } = validateCodeFormat(code);
    if (!valid) {
      alert(message);
    }
  };
}
*/

export default useDocumentCode;
