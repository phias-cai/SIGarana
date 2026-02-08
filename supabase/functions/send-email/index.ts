// Edge Function: send-email - SOLUCIÓN DEFINITIVA CON GMAIL
// Usa npm:nodemailer (igual que tu NestJS)
// Deno soporta npm packages desde v1.28+

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

// Tipos
interface EmailRequest {
  type: 'pending' | 'approved' | 'rejected';
  to: string | string[];
  document: {
    id: string;
    name: string;
    code: string;
    version: number;
    created_by_name: string;
  };
  rejection_reason?: string;
}

// Template base HTML
const getBaseTemplate = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #6dbd96 0%, #2e5244 100%); padding: 30px 20px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; color: white; letter-spacing: 1px; }
    .logo-art { color: #dedecc; font-weight: 400; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; color: #2e5244; margin-bottom: 20px; font-weight: 600; }
    .message { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 30px; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #6dbd96; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; margin-bottom: 12px; }
    .info-label { font-weight: 600; color: #2e5244; min-width: 120px; }
    .info-value { color: #333; }
    .button { display: inline-block; background: linear-gradient(135deg, #6dbd96 0%, #2e5244 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .footer { background-color: #2e5244; color: white; padding: 30px 20px; text-align: center; }
    .footer-title { font-size: 18px; margin-bottom: 10px; color: #6dbd96; }
    .footer-text { font-size: 14px; color: #dedecc; margin: 5px 0; }
    .divider { height: 1px; background: linear-gradient(to right, transparent, #6dbd96, transparent); margin: 30px 0; }
    .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
    .alert-danger { background-color: #f8d7da; border-left-color: #dc3545; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Garana <span class="logo-art">art</span></div>
      <div style="color: #dedecc; font-size: 14px; margin-top: 8px; letter-spacing: 2px;">SISTEMA DE GESTIÓN INTEGRAL</div>
    </div>
    ${content}
    <div class="footer">
      <div class="footer-title">Garana Art</div>
      <div class="footer-text">Sistema de Gestión Integral</div>
      <div class="footer-text">Manizales, Caldas - Colombia</div>
      <div class="footer-text" style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
        Este es un correo automático, por favor no responder.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Templates
const getPendingTemplate = (data: EmailRequest): string => {
  const content = `
    <div class="content">
      <div class="title">📄 Nuevo Documento Pendiente de Aprobación</div>
      <div class="message">
        Se ha ${data.document.version > 1 ? 'modificado un documento existente que' : 'creado un nuevo documento que'} requiere tu aprobación.
      </div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${data.document.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${data.document.code}</strong></div></div>
        <div class="info-row"><div class="info-label">Versión:</div><div class="info-value">v${data.document.version}</div></div>
        <div class="info-row"><div class="info-label">Creado por:</div><div class="info-value">${data.document.created_by_name}</div></div>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://garana-sig.vercel.app/gestion-documental" class="button">Ver Listado</a>
      </div>
    </div>
  `;
  return getBaseTemplate('Documento Pendiente', content);
};

const getApprovedTemplate = (data: EmailRequest): string => {
  const content = `
    <div class="content">
      <div class="title">✅ Documento Aprobado</div>
      <div class="message">¡Tu documento ha sido aprobado!</div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${data.document.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${data.document.code}</strong></div></div>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://garana-sig.vercel.app/gestion-documental" class="button">Ver Documento</a>
      </div>
    </div>
  `;
  return getBaseTemplate('Documento Aprobado', content);
};

const getRejectedTemplate = (data: EmailRequest): string => {
  const content = `
    <div class="content">
      <div class="title">❌ Documento Rechazado</div>
      <div class="message">Tu documento no ha sido aprobado.</div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${data.document.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${data.document.code}</strong></div></div>
      </div>
      ${data.rejection_reason ? `<div class="alert-danger"><strong>Motivo:</strong><br>${data.rejection_reason}</div>` : ''}
    </div>
  `;
  return getBaseTemplate('Documento Rechazado', content);
};

// Función principal
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('🚀 Iniciando envío con nodemailer (npm)...');
    
    const body = await req.json();
    const { type, to, document, rejection_reason }: EmailRequest = body;

    if (!type || !to || !document) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener credenciales (igual que tu NestJS)
    const GMAIL_USER = Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');

    console.log('📧 Gmail User:', GMAIL_USER);
    console.log('🔑 Password configurado:', GMAIL_APP_PASSWORD ? 'SÍ' : 'NO');

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error('❌ Credenciales incompletas');
      return new Response(
        JSON.stringify({ error: 'Credenciales Gmail no configuradas' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear transporter (EXACTAMENTE igual que tu NestJS)
    console.log('🔧 Creando transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    // Generar contenido
    let subject = '';
    let html = '';

    switch (type) {
      case 'pending':
        subject = `📄 Documento pendiente: ${document.code}`;
        html = getPendingTemplate({ type, to, document, rejection_reason });
        break;
      case 'approved':
        subject = `✅ Documento aprobado: ${document.code}`;
        html = getApprovedTemplate({ type, to, document, rejection_reason });
        break;
      case 'rejected':
        subject = `❌ Documento rechazado: ${document.code}`;
        html = getRejectedTemplate({ type, to, document, rejection_reason });
        break;
    }

    const recipients = Array.isArray(to) ? to : [to];
    console.log('📧 Enviando a:', recipients);

    // Enviar email (igual que tu NestJS)
    console.log('📨 Enviando con sendMail...');
    const info = await transporter.sendMail({
      from: `Garana SIG <${GMAIL_USER}>`,
      to: recipients.join(', '),
      subject: subject,
      html: html,
    });

    console.log('✅ Email enviado:', info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email enviado a ${recipients.length} destinatario(s)`,
        recipients: recipients,
        messageId: info.messageId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'Error al enviar email',
        details: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});