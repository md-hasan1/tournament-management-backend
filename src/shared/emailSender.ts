import nodemailer from "nodemailer";

const emailSender = async (
  to: string,
  html: string,
  subject: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL, // your Gmail address
        pass: process.env.APP_PASS, // Gmail App Password
      },
    });

    const mailOptions = {
      from: `"Crown & Pitch" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      text: html.replace(/<[^>]+>/g, ""),
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info.messageId;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email. Please try again later.");
  }
};

export default emailSender;