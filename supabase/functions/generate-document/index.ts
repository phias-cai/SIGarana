// Supabase Edge Function: generate-document
// Genera documentos Word desde plantillas usando docxtemplater

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import PizZip from "https://esm.sh/pizzip@3.1.6"
import Docxtemplater from "https://esm.sh/docxtemplater@3.42.0"

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1️⃣ Obtener parámetros
    const { template_code, data } = await req.json()

    if (!template_code) throw new Error("template_code es requerido")
    if (!data) throw new Error("data es requerido")

    console.log("📋 Generando documento:", template_code)

    // 2️⃣ Inicializar Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3️⃣ Buscar plantilla en DB
    const { data: template, error: templateError } = await supabase
      .from("document_template")
      .select("*")
      .eq("code", template_code)
      .eq("is_active", true)
      .single()

    if (templateError || !template) {
      throw new Error(`Plantilla no encontrada: ${template_code}`)
    }

    console.log("📄 Plantilla encontrada:", template.name)

    // 4️⃣ Descargar archivo desde Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(template.bucket_name)
      .download(template.file_path)

    if (downloadError || !fileData) {
      throw new Error(
        `Error descargando plantilla: ${downloadError?.message}`
      )
    }

    console.log("✅ Plantilla descargada")

    // 5️⃣ Convertir Blob a ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Validar que sea DOCX (ZIP empieza con PK)
    const signature = new Uint8Array(arrayBuffer.slice(0, 2))
    if (signature[0] !== 80 || signature[1] !== 75) {
      throw new Error("El archivo no es un DOCX válido")
    }

    // 6️⃣ Crear instancia Docxtemplater con delimitadores personalizados
    const zip = new PizZip(arrayBuffer)

    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "[[",
        end: "]]",
      },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    })

    // 7️⃣ Preparar datos
    const templateData = {
      ...data,
      meeting_date: data.meeting_date
        ? new Date(data.meeting_date).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
      commitments:
        data.commitments?.map((c: any) => ({
          activity: c.activity || "",
          responsible_name: c.responsible_name || "",
          due_date: c.due_date
            ? new Date(c.due_date).toLocaleDateString("es-CO")
            : "",
        })) || [],
      attendees:
        data.attendees?.map((a: any) => ({
          name: a.name || "",
          position: a.position || "",
        })) || [],
    }

    console.log("📊 Datos preparados")

    // 8️⃣ Renderizar documento
    try {
      doc.render(templateData)
    } catch (error: any) {
      console.error("❌ Error renderizando template:", error)
      throw new Error("Error procesando etiquetas del documento")
    }

    // 9️⃣ Generar archivo final
    const generatedDoc = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    })

    const filename = `${
      data.consecutive || template_code
    }_${Date.now()}.docx`

    console.log("✅ Documento generado exitosamente")

    // 🔟 Responder con archivo
    return new Response(generatedDoc, {
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("❌ Error:", error)

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})