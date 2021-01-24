import sgMail from '@sendgrid/mail';
import { __prod__ } from '../../constants';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendInviteCamperEmail = async (
  toAddress: string,
  params: string,
  existingUser: boolean,
) => {
  try {
    await sgMail.send({
      to: toAddress,
      from: process.env.SENDGRID_FROM_ADDRESS,
      subject: "You've been invited to join a Campsite!",
      html: existingUser
        ? `
      <p>You have been invited to join a campsite via Campginly!</P
      <a href="${process.env.CORS_ORIGIN}/invite/?${params}">Click here to join in!</a>
    `
        : `
    <p>You have been invited to join Campingly!</P
    <a href="${process.env.CORS_ORIGIN}/invite/?${params}">Click here to review and get started with Campginly!</a>
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

export default sendInviteCamperEmail;
