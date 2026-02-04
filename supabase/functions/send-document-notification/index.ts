// supabase/functions/send-document-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// 📧 CONFIGURACIÓN DE EMAILS - FÁCIL DE MODIFICAR
const MANAGEMENT_EMAILS = [
 // 'margaritaramirez1314@gmail.com',
  //'dipamato@gmail.com',
  'garanasig@gmail.com'  
];

// 🎨 COLORES DEL SISTEMA (según tu paleta)
const COLORS = {
  primary: '#2e5244',
  secondary: '#6dbd96',
  accent: '#6f7b2c',
  light: '#dedecc'
};

// 📧 REMITENTE (puedes cambiar cuando tengas dominio verificado)
const FROM_EMAIL = 'onboarding@resend.dev';
const FROM_NAME = 'Garana SIG - Sistema de Gestión';

serve(async (req) => {
  try {
    // 🔐 Verificar que es una petición POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 📦 Obtener datos del documento desde el body
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🔌 Conectar a Supabase para obtener datos completos del documento
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 📄 Obtener documento con todas sus relaciones
    const { data: document, error: docError } = await supabaseClient
      .from('document')
      .select(`
        *,
        document_type:document_type_id (
          name,
          code
        ),
        process:process_id (
          name,
          code
        ),
        created_by_profile:created_by (
          full_name,
          email
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🎨 Generar HTML del email
    const emailHtml = generateEmailHTML(document);

    // 📧 Enviar email usando Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: MANAGEMENT_EMAILS,
        subject: `📋 Nuevo documento pendiente de aprobación: ${document.code}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error from Resend:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Email sent successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data.id,
        recipients: MANAGEMENT_EMAILS 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// 🎨 Función para generar HTML del email
function generateEmailHTML(document: any): string {
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const documentUrl = `${appUrl}/gestion-documental`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Pendiente de Aprobación</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${COLORS.primary};
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background-color: #fef3c7;
      border-left: 4px solid #d97706;
      padding: 15px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .alert-box p {
      margin: 0;
      color: #92400e;
      font-weight: 500;
    }
    .document-info {
      background-color: ${COLORS.light};
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: ${COLORS.primary};
      min-width: 140px;
      font-size: 14px;
    }
    .info-value {
      color: #4b5563;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #fef3c7;
      color: #d97706;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #d97706;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${COLORS.secondary};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px auto;
      display: block;
      max-width: 250px;
    }
    .button:hover {
      background-color: ${COLORS.primary};
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📋 Nuevo Documento Pendiente</h1>
      <p>Sistema de Gestión Integral - Garana</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Alert -->
      <div class="alert-box">
        <p>⚠️ Tienes un nuevo documento que requiere tu aprobación</p>
      </div>

      <!-- Información del Documento -->
      <div class="document-info">
        <div class="info-row">
          <div class="info-label">Código:</div>
          <div class="info-value"><strong>${document.code}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Nombre:</div>
          <div class="info-value">${document.name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tipo:</div>
          <div class="info-value">${document.document_type?.name || 'N/A'} (${document.document_type?.code || 'N/A'})</div>
        </div>
        <div class="info-row">
          <div class="info-label">Proceso:</div>
          <div class="info-value">${document.process?.name || 'N/A'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Versión:</div>
          <div class="info-value">v${String(document.version).padStart(2, '0')}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Creado por:</div>
          <div class="info-value">${document.created_by_profile?.full_name || 'N/A'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fecha:</div>
          <div class="info-value">${new Date(document.created_at).toLocaleDateString('es-CO', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Estado:</div>
          <div class="info-value"><span class="badge">PENDIENTE APROBACIÓN</span></div>
        </div>
      </div>

      ${document.objective ? `
      <div style="margin-bottom: 20px;">
        <strong style="color: ${COLORS.primary};">Objetivo:</strong>
        <p style="color: #4b5563; margin: 8px 0;">${document.objective}</p>
      </div>
      ` : ''}

      <!-- Botón de Acción -->
      <a href="${documentUrl}" class="button">
        🔍 Revisar y Aprobar
      </a>

      <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
        Haz clic en el botón para ir al sistema y revisar el documento
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Garana SIG</strong> - Sistema de Gestión Integral</p>
      <p>Este es un correo automático, por favor no responder.</p>
      <p style="margin-top: 10px; font-size: 11px;">
        Si tienes problemas con el enlace, copia y pega esta URL en tu navegador:<br>
        <span style="color: ${COLORS.accent};">${documentUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}