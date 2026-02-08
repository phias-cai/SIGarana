// test-email-garana.js
// Script para probar el sistema de notificaciones por email de Garana SIG

const SUPABASE_URL = 'https://wnsnymxabmxswnpcpvoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induc255bXhhYm14c3ducGNwdm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjI0MzcsImV4cCI6MjA4NDA5ODQzN30.Cu4hYlIrqnQxzGrDax6goByU-iy3ac3Xhx8jFaKvtVc';

// Email de prueba del gerente
const TEST_EMAIL = 'dipamato@gmail.com';

// Función para enviar email
async function sendTestEmail() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     PRUEBA DE EMAIL - Garana SIG                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📧 Enviando email de prueba...');
    console.log('📮 Destinatario:', TEST_EMAIL);
    console.log('🔗 URL:', SUPABASE_URL + '/functions/v1/send-email');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'pending',
          to: TEST_EMAIL,
          document: {
            id: 'test-001',
            name: 'Plan de Calidad 2026',
            code: 'PR-CAL-01',
            version: 1,
            created_by_name: 'Ana María Ospina',
          },
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ ¡EMAIL ENVIADO CORRECTAMENTE!\n');
      console.log('📊 Respuesta del servidor:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n📬 Revisa tu bandeja de entrada en:', TEST_EMAIL);
      console.log('⚠️  Si no llega, revisa también la carpeta de SPAM\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ TODO FUNCIONÓ CORRECTAMENTE');
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('\n❌ ERROR al enviar email\n');
      console.log('📊 Respuesta del servidor:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n💡 Posibles causas:');
      console.log('   - Variables de entorno mal configuradas en Supabase');
      console.log('   - App Password de Gmail incorrecto (debe ser sin espacios)');
      console.log('   - Gmail bloqueó el acceso');
      console.log('\n🔧 Verifica en Supabase Dashboard:');
      console.log('   Settings → Edge Functions → Secrets');
      console.log('   Que SMTP_PASS sea: tpaagnaapdoebaij (sin espacios)\n');
    }

  } catch (error) {
    console.log('\n❌ EXCEPCIÓN AL ENVIAR EMAIL\n');
    console.error('Error:', error.message);
    console.log('\n💡 Verifica que:');
    console.log('   - La Edge Function esté desplegada');
    console.log('   - Las variables de entorno estén configuradas');
    console.log('   - Tu conexión a internet funcione\n');
  }
}

// Ejecutar el test
console.log('Iniciando prueba...\n');
sendTestEmail();