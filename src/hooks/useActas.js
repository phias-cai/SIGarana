// src/hooks/useActas.js
// ✅ Hook para gestionar actas de reunión con Supabase

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useActas() {
  const { user } = useAuth();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================================
  // FETCH ACTAS (listado con contadores)
  // ============================================================================
  const fetchActas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('acta')
        .select(`
          *,
          attendees_count:acta_attendee(count),
          commitments_count:acta_commitment(count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transformar los contadores
      const actasTransformed = data.map(acta => ({
        ...acta,
        attendees_count: acta.attendees_count?.[0]?.count || 0,
        commitments_count: acta.commitments_count?.[0]?.count || 0
      }));

      setActas(actasTransformed);
      return actasTransformed;
    } catch (err) {
      console.error('Error fetching actas:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FETCH ACTA BY ID (con asistentes y compromisos completos)
  // ============================================================================
  const fetchActaById = async (id) => {
    try {
      console.log('📋 Cargando acta completa:', id);

      // 1. Cargar acta principal
      const { data: acta, error: actaError } = await supabase
        .from('acta')
        .select('*')
        .eq('id', id)
        .single();

      if (actaError) throw actaError;

      // 2. Cargar asistentes
      const { data: attendees, error: attendeesError } = await supabase
        .from('acta_attendee')
        .select('*')
        .eq('acta_id', id)
        .order('order_index');

      if (attendeesError) throw attendeesError;

      // 3. Cargar compromisos
      const { data: commitments, error: commitmentsError } = await supabase
        .from('acta_commitment')
        .select('*')
        .eq('acta_id', id)
        .order('order_index');

      if (commitmentsError) throw commitmentsError;

      const actaCompleta = {
        ...acta,
        attendees: attendees || [],
        commitments: commitments || []
      };

      console.log('✅ Acta completa cargada:', actaCompleta);
      return actaCompleta;
    } catch (err) {
      console.error('Error fetching acta by id:', err);
      throw err;
    }
  };

  // ============================================================================
  // CREATE ACTA
  // ============================================================================
  const createActa = async (actaData) => {
    try {
      console.log('📝 Creando nueva acta...', actaData);

      // ✅ IMPORTANTE: Agregar created_by y quitar consecutive (se genera auto)
      const actaToInsert = {
        ...actaData,
        created_by: user.id, // ✅ Registro de quién crea el acta
        approved_by: actaData.approved_by || null, // ✅ Convertir "" a null
        // El status se maneja automáticamente por el trigger según approved_by
      };

      // Extraer arrays y consecutive (no van en el INSERT principal)
      const { attendees, commitments, consecutive, ...actaFields } = actaToInsert;

      // 1️⃣ Crear acta principal
      const { data: newActa, error: actaError } = await supabase
        .from('acta')
        .insert([actaFields])
        .select()
        .single();

      if (actaError) throw actaError;

      console.log('✅ Acta creada:', newActa.consecutive);

      // 2️⃣ Insertar asistentes
      if (attendees && attendees.length > 0) {
        const attendeesData = attendees.map(a => ({
          ...a,
          acta_id: newActa.id
        }));

        const { error: attendeesError } = await supabase
          .from('acta_attendee')
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
        console.log(`✅ ${attendees.length} asistentes agregados`);
      }

      // 3️⃣ Insertar compromisos
      if (commitments && commitments.length > 0) {
        const commitmentsData = commitments.map(c => ({
          ...c,
          acta_id: newActa.id
        }));

        const { error: commitmentsError } = await supabase
          .from('acta_commitment')
          .insert(commitmentsData);

        if (commitmentsError) throw commitmentsError;
        console.log(`✅ ${commitments.length} compromisos agregados`);
      }

      // Recargar lista
      await fetchActas();

      return newActa;
    } catch (err) {
      console.error('❌ Error creando acta:', err);
      throw err;
    }
  };

  // ============================================================================
  // UPDATE ACTA
  // ============================================================================
  const updateActa = async (id, actaData) => {
    try {
      console.log('📝 Actualizando acta:', id);

      const { attendees, commitments, ...actaFields } = actaData;

      // ✅ Limpiar approved_by antes de actualizar
      if (actaFields.approved_by !== undefined) {
        actaFields.approved_by = actaFields.approved_by || null;
      }

      // 1️⃣ Actualizar acta principal
      const { error: actaError } = await supabase
        .from('acta')
        .update(actaFields)
        .eq('id', id);

      if (actaError) throw actaError;

      // 2️⃣ Actualizar asistentes (delete + insert)
      if (attendees !== undefined) {
        // Eliminar asistentes existentes
        await supabase.from('acta_attendee').delete().eq('acta_id', id);

        // Insertar nuevos
        if (attendees.length > 0) {
          const attendeesData = attendees.map(a => ({
            ...a,
            acta_id: id
          }));

          const { error: attendeesError } = await supabase
            .from('acta_attendee')
            .insert(attendeesData);

          if (attendeesError) throw attendeesError;
        }
      }

      // 3️⃣ Actualizar compromisos (delete + insert)
      if (commitments !== undefined) {
        // Eliminar compromisos existentes
        await supabase.from('acta_commitment').delete().eq('acta_id', id);

        // Insertar nuevos
        if (commitments.length > 0) {
          const commitmentsData = commitments.map(c => ({
            ...c,
            acta_id: id
          }));

          const { error: commitmentsError } = await supabase
            .from('acta_commitment')
            .insert(commitmentsData);

          if (commitmentsError) throw commitmentsError;
        }
      }

      console.log('✅ Acta actualizada');

      // Recargar lista
      await fetchActas();
    } catch (err) {
      console.error('❌ Error actualizando acta:', err);
      throw err;
    }
  };

  // ============================================================================
  // DELETE ACTA (soft delete -> archived)
  // ============================================================================
  const deleteActa = async (id) => {
    try {
      console.log('🗑️ Archivando acta:', id);

      const { error } = await supabase
        .from('acta')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Acta archivada');

      // Recargar lista
      await fetchActas();
    } catch (err) {
      console.error('❌ Error archivando acta:', err);
      throw err;
    }
  };

  // Cargar actas al montar
  useEffect(() => {
    fetchActas();
  }, []);

  return {
    actas,
    loading,
    error,
    fetchActas,
    fetchActaById,
    createActa,
    updateActa,
    deleteActa,
  };
}