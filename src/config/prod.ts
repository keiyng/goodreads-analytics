const emailSender = process.env.EMAIL_SENDER;
const emailSenderPw = process.env.EMAIL_SENDER_PW;
const emailReceiver = process.env.EMAIL_RECEIVER;
const dbUser = process.env.DB_USER;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;

export default {
  emailSender,
  emailSenderPw,
  emailReceiver,
  dbUser,
  dbHost,
  dbName,
  dbPassword,
};
