// supabase/functions/send-document-notification/index.ts
// ══════════════════════════════════════════════════════════════════════
// Edge Function unificada: Documentos + Acciones de Mejora
// Usa nodemailer + Gmail. Logo corporativo desde Supabase Storage.
// ══════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

// ── URL pública del logo en Supabase Storage ──────────────────────────
const LOGO_URL =
  "https://wnsnymxabmxswnpcpvoj.supabase.co/storage/v1/object/public/templates/garana1.png";

const APP_URL = "https://garana-sig.vercel.app";

// ── Tipos ─────────────────────────────────────────────────────────────
interface EmailRequest {
  // Tipos documentos (existentes)
  type:
    | "pending"
    | "approved"
    | "rejected"
    // Tipos acciones de mejora (nuevos)
    | "accion_mejora_creacion"
    | "accion_mejora_cierre_definitivo"
    | "accion_mejora_seguimiento_pendiente";
  to: string | string[];
  // Para documentos
  document?: {
    id: string;
    name: string;
    code: string;
    version: number;
    created_by_name: string;
  };
  rejection_reason?: string;
  // Para acciones de mejora
  data?: {
    consecutive: string;
    finding: string;
    responsible_name: string;
    closure_reason?: string;
    reviewed_by?: string;
    proposed_date?: string;
    closure_type?: string;
    created_by_name?: string;
  };
}

// ══════════════════════════════════════════════════════════════════════
// TEMPLATE BASE — con logo real
// ══════════════════════════════════════════════════════════════════════
const getBaseTemplate = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #6dbd96 0%, #2e5244 100%); padding: 24px 20px; text-align: center; }
    .header img { max-height: 70px; max-width: 220px; object-fit: contain; display: block; margin: 0 auto; }
    .header-sub { color: #dedecc; font-size: 13px; margin-top: 10px; letter-spacing: 2px; }
    .content { padding: 36px 30px; }
    .title { font-size: 22px; color: #2e5244; margin-bottom: 16px; font-weight: 700; }
    .message { font-size: 15px; color: #444; line-height: 1.65; margin-bottom: 24px; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #6dbd96; padding: 18px 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-weight: 700; color: #2e5244; min-width: 140px; }
    .info-value { color: #333; }
    .reason-box { background-color: #f0f7f4; border-left: 4px solid #2e5244; padding: 16px 20px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6dbd96 0%, #2e5244 100%); color: white !important; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; margin-top: 10px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .badge-green  { background: #dcfce7; color: #166534; }
    .badge-amber  { background: #fef3c7; color: #92400e; }
    .badge-red    { background: #fee2e2; color: #991b1b; }
    .alert-danger { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 14px 18px; margin: 16px 0; border-radius: 4px; color: #7f1d1d; font-size: 14px; }
    .footer { background-color: #2e5244; color: white; padding: 28px 20px; text-align: center; }
    .footer-title { font-size: 16px; margin-bottom: 8px; color: #6dbd96; font-weight: 700; }
    .footer-text  { font-size: 13px; color: #dedecc; margin: 4px 0; }
    .footer-note  { margin-top: 14px; font-size: 11px; color: #dedecc; opacity: 0.7; }
    .divider { height: 1px; background: linear-gradient(to right, transparent, #6dbd96, transparent); margin: 28px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Garana Art" />
      <div class="header-sub">SISTEMA DE GESTIÓN INTEGRAL</div>
    </div>
    ${content}
    <div class="footer">
      <div class="footer-title">Garana Art</div>
      <div class="footer-text">Sistema de Gestión Integral · SIG</div>
      <div class="footer-text">Manizales, Caldas — Colombia</div>
      <div class="footer-note">Este es un correo automático, por favor no responder.</div>
    </div>
  </div>
</body>
</html>`;

// ══════════════════════════════════════════════════════════════════════
// TEMPLATES — GESTIÓN DOCUMENTAL (sin cambios)
// ══════════════════════════════════════════════════════════════════════
const getPendingTemplate = (data: EmailRequest): string => {
  const d = data.document!;
  return getBaseTemplate("Documento Pendiente", `
    <div class="content">
      <div class="title">📄 Nuevo Documento Pendiente de Aprobación</div>
      <div class="message">
        Se ha ${d.version > 1 ? "modificado un documento existente que" : "creado un nuevo documento que"} requiere tu aprobación.
      </div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${d.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${d.code}</strong></div></div>
        <div class="info-row"><div class="info-label">Versión:</div><div class="info-value">v${d.version}</div></div>
        <div class="info-row"><div class="info-label">Creado por:</div><div class="info-value">${d.created_by_name}</div></div>
      </div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/gestion-documental" class="btn">Ver Listado de Documentos</a>
      </div>
    </div>`);
};

const getApprovedTemplate = (data: EmailRequest): string => {
  const d = data.document!;
  return getBaseTemplate("Documento Aprobado", `
    <div class="content">
      <div class="title">✅ Documento Aprobado</div>
      <div class="message">¡Tu documento ha sido aprobado exitosamente!</div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${d.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${d.code}</strong></div></div>
      </div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/gestion-documental" class="btn">Ver Documento</a>
      </div>
    </div>`);
};

const getRejectedTemplate = (data: EmailRequest): string => {
  const d = data.document!;
  return getBaseTemplate("Documento Rechazado", `
    <div class="content">
      <div class="title">❌ Documento Rechazado</div>
      <div class="message">Tu documento no ha sido aprobado en esta revisión.</div>
      <div class="info-box">
        <div class="info-row"><div class="info-label">Documento:</div><div class="info-value"><strong>${d.name}</strong></div></div>
        <div class="info-row"><div class="info-label">Código:</div><div class="info-value"><strong>${d.code}</strong></div></div>
      </div>
      ${data.rejection_reason
        ? `<div class="alert-danger"><strong>Motivo del rechazo:</strong><br>${data.rejection_reason}</div>`
        : ""}
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/gestion-documental" class="btn">Ver Documento</a>
      </div>
    </div>`);
};

// ══════════════════════════════════════════════════════════════════════
// TEMPLATES — ACCIONES DE MEJORA (nuevos)
// ══════════════════════════════════════════════════════════════════════

// 1️⃣ Creación — se notifica al responsable y a gerencia
const getAccionCreacionTemplate = (data: EmailRequest): string => {
  const d = data.data!;
  return getBaseTemplate("Nueva Acción de Mejora Asignada", `
    <div class="content">
      <div class="title">🎯 Nueva Acción de Mejora Asignada</div>
      <div class="message">
        Se ha registrado una nueva acción de mejora en el sistema.
        Por favor revisa los detalles y realiza el seguimiento correspondiente.
      </div>
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Consecutivo:</div>
          <div class="info-value"><strong>${d.consecutive}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Responsable:</div>
          <div class="info-value">${d.responsible_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Creado por:</div>
          <div class="info-value">${d.created_by_name || "—"}</div>
        </div>
        ${d.proposed_date ? `
        <div class="info-row">
          <div class="info-label">Fecha límite:</div>
          <div class="info-value"><strong>${d.proposed_date}</strong></div>
        </div>` : ""}
      </div>
      <div class="divider"></div>
      <p style="font-size:13px;font-weight:700;color:#2e5244;margin-bottom:8px;">📋 Hallazgo:</p>
      <div class="reason-box">${d.finding || "Sin descripción"}</div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/mejoramiento-continuo" class="btn">Ver Acción de Mejora</a>
      </div>
    </div>`);
};

// 2️⃣ Cierre definitivo (SI) — acción archivada
const getAccionCierreTemplate = (data: EmailRequest): string => {
  const d = data.data!;
  return getBaseTemplate("Acción de Mejora Cerrada", `
    <div class="content">
      <div class="title">✅ Acción de Mejora Cerrada Definitivamente</div>
      <div class="message">
        La siguiente acción de mejora ha sido <strong>cerrada con éxito</strong>
        y archivada en el sistema.
      </div>
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Consecutivo:</div>
          <div class="info-value"><strong>${d.consecutive}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Responsable:</div>
          <div class="info-value">${d.responsible_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Revisado por:</div>
          <div class="info-value">${d.reviewed_by || "—"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Estado:</div>
          <div class="info-value">
            <span class="badge badge-green">✅ Cierre definitivo</span>
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <p style="font-size:13px;font-weight:700;color:#2e5244;margin-bottom:8px;">📋 Hallazgo original:</p>
      <div class="reason-box">${d.finding || "—"}</div>
      <p style="font-size:13px;font-weight:700;color:#2e5244;margin:16px 0 8px;">📝 Evidencia de cierre:</p>
      <div class="reason-box">${d.closure_reason || "—"}</div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/mejoramiento-continuo" class="btn">Ver Registro</a>
      </div>
    </div>`);
};

// 3️⃣ Seguimiento pendiente (NO) — acción permanece abierta
const getAccionSeguimientoTemplate = (data: EmailRequest): string => {
  const d = data.data!;
  return getBaseTemplate("Seguimiento Pendiente — Acción de Mejora", `
    <div class="content">
      <div class="title">🕐 Acción de Mejora — Seguimiento Pendiente</div>
      <div class="message">
        La siguiente acción de mejora <strong>permanece activa</strong> y requiere
        seguimiento. Se ha registrado una nota de revisión.
      </div>
      <div class="info-box">
        <div class="info-row">
          <div class="info-label">Consecutivo:</div>
          <div class="info-value"><strong>${d.consecutive}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Responsable:</div>
          <div class="info-value">${d.responsible_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Revisado por:</div>
          <div class="info-value">${d.reviewed_by || "—"}</div>
        </div>
        ${d.proposed_date ? `
        <div class="info-row">
          <div class="info-label">Fecha límite:</div>
          <div class="info-value"><strong>${d.proposed_date}</strong></div>
        </div>` : ""}
        <div class="info-row">
          <div class="info-label">Estado:</div>
          <div class="info-value">
            <span class="badge badge-amber">🕐 En espera de solución</span>
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <p style="font-size:13px;font-weight:700;color:#2e5244;margin-bottom:8px;">📋 Hallazgo:</p>
      <div class="reason-box">${d.finding || "—"}</div>
      <p style="font-size:13px;font-weight:700;color:#2e5244;margin:16px 0 8px;">📝 Pendiente / Plan de acción:</p>
      <div class="reason-box">${d.closure_reason || "—"}</div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${APP_URL}/mejoramiento-continuo" class="btn">Ver Acción de Mejora</a>
      </div>
    </div>`);
};

// ══════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ══════════════════════════════════════════════════════════════════════
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    console.log("🚀 Iniciando envío de email...");

    const body = await req.json();
    const { type, to, document, rejection_reason, data }: EmailRequest = body;

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Faltan parámetros: type y to son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar que llegue el payload correcto según el tipo
    const isAccionType = type.startsWith("accion_mejora");
    if (!isAccionType && !document) {
      return new Response(
        JSON.stringify({ error: "Falta el campo document para tipos de documento" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (isAccionType && !data) {
      return new Response(
        JSON.stringify({ error: "Falta el campo data para tipos de acción de mejora" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Credenciales Gmail
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("❌ Credenciales Gmail no configuradas");
      return new Response(
        JSON.stringify({ error: "Credenciales Gmail no configuradas" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // ── Generar subject y html según tipo ────────────────────────────
    let subject = "";
    let html = "";

    switch (type) {
      // ── Gestión Documental ────────────────────────────────────────
      case "pending":
        subject = `📄 Documento pendiente de aprobación: ${document!.code}`;
        html = getPendingTemplate({ type, to, document, rejection_reason });
        break;
      case "approved":
        subject = `✅ Documento aprobado: ${document!.code}`;
        html = getApprovedTemplate({ type, to, document, rejection_reason });
        break;
      case "rejected":
        subject = `❌ Documento rechazado: ${document!.code}`;
        html = getRejectedTemplate({ type, to, document, rejection_reason });
        break;

      // ── Acciones de Mejora ────────────────────────────────────────
      case "accion_mejora_creacion":
        subject = `🎯 Nueva Acción de Mejora asignada: ${data!.consecutive}`;
        html = getAccionCreacionTemplate({ type, to, data });
        break;
      case "accion_mejora_cierre_definitivo":
        subject = `✅ Acción de Mejora cerrada: ${data!.consecutive}`;
        html = getAccionCierreTemplate({ type, to, data });
        break;
      case "accion_mejora_seguimiento_pendiente":
        subject = `🕐 Seguimiento pendiente — Acción de Mejora: ${data!.consecutive}`;
        html = getAccionSeguimientoTemplate({ type, to, data });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Tipo de email no reconocido: ${type}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const recipients = Array.isArray(to) ? to : [to];
    console.log(`📧 Enviando [${type}] a:`, recipients);

    const info = await transporter.sendMail({
      from: `Garana SIG <${GMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      html,
    });

    console.log("✅ Email enviado:", info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email enviado a ${recipients.length} destinatario(s)`,
        type,
        recipients,
        messageId: info.messageId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Error al enviar email", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
});