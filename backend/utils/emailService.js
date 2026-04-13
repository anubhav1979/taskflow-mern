const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // VERY IMPORTANT
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your TaskFlow Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #38bdf8; font-size: 28px; margin: 0;">TaskFlow</h1>
          <p style="color: #64748b; margin-top: 5px;">Smart Task Management</p>
        </div>
        <h2 style="color: #f1f5f9;">Hi ${name}! 👋</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          Welcome to TaskFlow! Please verify your email address to complete your registration.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #38bdf8; color: #0f172a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
        <hr style="border-color: #1e293b; margin: 30px 0;" />
        <p style="color: #475569; font-size: 12px; text-align: center;">TaskFlow — Manage your team's work smarter</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

const sendTaskAssignmentEmail = async (email, taskTitle, projectName, assignerName) => {
  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #38bdf8;">TaskFlow</h1>
        <h2 style="color: #f1f5f9;">You have a new task! 📋</h2>
        <p style="color: #94a3b8;"><strong style="color:#38bdf8;">${assignerName}</strong> has assigned you a task in <strong style="color:#38bdf8;">${projectName}</strong>.</p>
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38bdf8;">
          <p style="margin: 0; color: #f1f5f9; font-size: 18px;">${taskTitle}</p>
        </div>
        <p style="color: #64748b;">Log in to TaskFlow to view your task details and start working on it.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login" 
             style="background: #38bdf8; color: #0f172a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Task
          </a>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendTaskAssignmentEmail };