import nodemailer from 'nodemailer';
import keys from './config/keys';

export class Mailer {
  transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: keys.emailSender,
        pass: keys.emailSenderPw,
      },
    });
  }

  sendErrorEmail(
    filePath: string,
    filename: string,
    subject: string,
    html: string
  ): void {
    const mailOptions: {
      [key: string]: string | { [key: string]: string }[];
    } = {
      from: keys.emailSender,
      to: keys.emailReceiver,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: filename,
          path: filePath,
          cid: 'gr-err-ss',
        },
      ],
    };

    this.transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`email sent! ${info.response}`);
      }
    });
  }
}
