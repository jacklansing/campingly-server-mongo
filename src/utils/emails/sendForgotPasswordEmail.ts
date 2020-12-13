import sgMail from '@sendgrid/mail';
import { __prod__ } from '../../constants';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendForgotPasswordEmail = async (
  toAddress: string,
  resetToken: string,
) => {
  try {
    await sgMail.send({
      to: toAddress,
      from: process.env.SENDGRID_FROM_ADDRESS,
      subject: 'Reset Your Password',
      html: `
      <p>To reset your password, click on the link below. This link will expire when used once, or after 3 days.</P
      <a href='${process.env.CORS_ORIGIN}/change-password/${resetToken}'>Click here to choose a new password.</a>
    `,
      mailSettings: {
        sandboxMode: {
          enable: !__prod__,
        },
      },
    });
  } catch (e) {
    console.error(e.response.body.errors);
  }
};

export default sendForgotPasswordEmail;
