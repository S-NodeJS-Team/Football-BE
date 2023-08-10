import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import * as nodemailer from 'nodemailer';
import mailerConfig from 'src/config/mailer';

@Injectable()
export class MailerService {
  async sendMailVerification(user: User, token: string) {
    const feHost = process.env.FE_HOST;
    const url = `${feHost}/auth/verify-account?token=${token}`;
    console.log(
      '🚀 ~ file: mailer.service.ts:13 ~ MailerService ~ sendMailVerification ~ url:',
      url,
    );

    const myOAuth2Client = new OAuth2Client(
      mailerConfig.GOOGLE_MAILER_CLIENT_ID,
      mailerConfig.GOOGLE_MAILER_CLIENT_SECRET,
    );
    // Set Refresh Token vào OAuth2Client Credentials
    myOAuth2Client.setCredentials({
      refresh_token: mailerConfig.GOOGLE_MAILER_REFRESH_TOKEN,
    });

    const myAccessTokenObject = await myOAuth2Client.getAccessToken();
    const myAccessToken = myAccessTokenObject?.token;

    const transport = nodemailer.createTransport({
      host: mailerConfig.host,
      port: mailerConfig.port,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: mailerConfig.ADMIN_EMAIL_ADDRESS,
        clientId: mailerConfig.GOOGLE_MAILER_CLIENT_ID,
        clientSecret: mailerConfig.GOOGLE_MAILER_CLIENT_SECRET,
        refresh_token: mailerConfig.GOOGLE_MAILER_REFRESH_TOKEN,
        accessToken: myAccessToken,
      },
    });

    const mailOptions = {
      to: user.email,
      subject: 'Welcome to Football site! Confirm your Email',
      html: `Hello ${user.name}, welcome to football site. Click link here to verify email ${url}`,
    };

    await transport.sendMail(mailOptions);
  }
}
