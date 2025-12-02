const nodemailer = require('nodemailer');

// Crear transporter con fallback a Ethereal para testing
const createTransporter = async () => {
  // Intentar Gmail primero
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'tu-contraseña-de-aplicacion-gmail') {
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
      console.log('🔄 Usando Ethereal como fallback...');
    }
  }
  
  // Fallback: Ethereal para testing
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
  const { transporter, isGmail } = await createTransporter();
  const resetUrl = `${process.env.BASE_URL || 'https://proyecto-oscar.onrender.com'}/auth/reset-password/${resetToken}`;
  
  const mailOptions = {
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

  const info = await transporter.sendMail(mailOptions);
  
  if (isGmail) {
    console.log('📧 Email enviado exitosamente a través de Gmail a:', email);
  } else {
    // Si es Ethereal, mostrar URL de preview
    console.log('📧 Email de prueba enviado! Ver en:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = {
  sendPasswordResetEmail
};