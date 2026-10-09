import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const generateSecurePassword = (length = 10) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  return password;
};

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendWelcomeEmail = async (email: string, userDetails: any, dummyPassword: string) => {
  const mailOptions = {
    from: `"Proofly (MEIL ESG)" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to Proofly - Account Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #031428;">Welcome to Proofly</h2>
        <p>Dear ${userDetails.name},</p>
        <p>Your account has been successfully created on the MEIL ESG360 (Proofly) platform by the Administrator.</p>
        
        <h3 style="color: #E25E5E;">Your Account Details:</h3>
        <ul>
          <li><strong>Employee ID:</strong> ${userDetails.employeeId}</li>
          <li><strong>Role:</strong> ${userDetails.role}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #E25E5E;">${dummyPassword}</span></p>
        </div>
        
        <p><strong>Important:</strong> You will be required to change your password immediately upon your first login for security purposes.</p>
        
        <p style="margin-top: 30px;">Best Regards,<br>MEIL Group ESG Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendForgotPasswordOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Proofly Support" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Proofly - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #031428;">Password Reset Request</h2>
        <p>We received a request to reset your password for your Proofly account.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #555;">Your One-Time Password (OTP) is:</p>
          <h1 style="margin: 10px 0; font-family: monospace; font-size: 32px; color: #E25E5E; letter-spacing: 5px;">${otp}</h1>
        </div>
        
        <p>This OTP is valid for 10 minutes. Do not share this with anyone.</p>
        <p>If you did not request this, please ignore this email or contact the administrator.</p>
        
        <p style="margin-top: 30px;">Best Regards,<br>Proofly Security</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWorkflowNotification = async (email: string, subject: string, actionDetails: any) => {
  const mailOptions = {
    from: `"Proofly Notifications" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Proofly Notification: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #031428;">${subject}</h2>
        <p>Hello,</p>
        <p>There is an update regarding a data record on the Proofly platform.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Indicator:</strong> ${actionDetails.indicatorName}</p>
          <p><strong>Status:</strong> <span style="color: ${actionDetails.status === 'APPROVED' ? 'green' : '#E25E5E'}; font-weight: bold;">${actionDetails.status}</span></p>
          <p><strong>Comments:</strong> ${actionDetails.comment || 'None'}</p>
          <p><strong>Action By:</strong> ${actionDetails.actionBy}</p>
        </div>
        
        <p>Please log in to the portal to view the details.</p>
        <p style="margin-top: 30px;">Best Regards,<br>Proofly System</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending workflow email:', error);
  }
};
