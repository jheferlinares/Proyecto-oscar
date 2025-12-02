const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const twilio = require('twilio');

const resend = new Resend(process.env.RESEND_API_KEY);

// Configurar Twilio
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Crear transporter con fallback a Ethereal para testing
const createTransporter = async () => {
  // En producción (Render), usar solo Ethereal debido a restricciones de red
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
  
  if (!isProduction && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'tu-contraseña-de-aplicacion-gmail') {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      // Verificar conexión
      await transporter.verify();
      console.log('✅ Usando Gmail para envío de emails');
      return { transporter, isGmail: true };
    } catch (error) {
      console.log('⚠️ Error con Gmail:', error.message);
    }
  }
  
  // Usar Ethereal (en producción o como fallback)
  console.log('📧 Usando Ethereal para emails (modo producción)');
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  
  return { transporter, isGmail: false };
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.BASE_URL || 'https://proyecto-oscar.onrender.com'}/auth/reset-password/${resetToken}`;
  
  const emailContent = {
    from: process.env.EMAIL_FROM || 'EANSA Sistema <noreply@eansa.com>',
    to: email,
    subject: 'Recuperación de Contraseña - EANSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d6efd;">Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en el Sistema de Mantenimiento EANSA.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0d6efd; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p><strong>Este enlace expira en 1 hora.</strong></p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Sistema de Mantenimiento EANSA<br>
          Este es un email automático, no responder.
        </p>
      </div>
    `
  };

  // Usar Twilio SendGrid en producción
  if (twilioClient) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.TWILIO_AUTH_TOKEN);
      
      await sgMail.send({
        to: email,
        from: 'EANSA Sistema <noreply@eansa.com>',
        subject: emailContent.subject,
        html: emailContent.html
      });
      
      console.log('✅ Email enviado exitosamente vía Twilio SendGrid a:', email);
      return { messageId: 'twilio-sendgrid-sent' };
    } catch (error) {
      console.error('❌ Error con Twilio SendGrid:', error.message);
      // Continuar con fallback
    }
  }

  // Usar Resend como fallback
  if (process.env.RESEND_API_KEY) {
    try {
      const { data } = await resend.emails.send({
        from: 'EANSA Sistema <onboarding@resend.dev>',
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html
      });
      
      console.log('✅ Email enviado exitosamente vía Resend a:', email);
      return { messageId: data.id };
    } catch (error) {
      console.error('❌ Error con Resend:', error.message);
    }
  }

  // Fallback: usar el sistema anterior (Gmail local / Ethereal)
  const { transporter, isGmail } = await createTransporter();
  const info = await transporter.sendMail(emailContent);
  
  if (isGmail) {
    console.log('📧 Email enviado exitosamente a través de Gmail a:', email);
  } else {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('📧 Email enviado a Ethereal. Preview:', previewUrl);
    console.log('🔗 Token de recuperación generado para:', email);
  }
  
  return info;
};

module.exports = {
  sendPasswordResetEmail
};