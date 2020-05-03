import nodemailer from 'nodemailer';
import { emailSender, emailSenderPw, emailReceiver } from './config/keys';

export class Mailer {
  transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailSender,
        pass: emailSenderPw,
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
      from: emailSender,
      to: emailReceiver,
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
