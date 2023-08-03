import { ForbiddenException, HttpCode, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { JWT_CONST } from 'src/common/constant';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
import { STATUS_CODES } from 'http';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async signIn(dto: AuthDto) {
    const user = await this.prisma.user.findFirst({
      where : {
        email: dto.email
      }
    });

    if (!user) {
      return {
        status: HttpStatus.FORBIDDEN,
        message : 'Email is not exist',
        access_token : ''
      }
    }

    const pwdMatches = await argon.verify(user.password, dto.password);

    if (!pwdMatches) {
      return {
        status: HttpStatus.FORBIDDEN,
        message : 'Your password was wrong',
        access_token : ''
      }
    }

    return this.signToken(user.id, user.email);
  }

  async signUp(dto: AuthDto) {
    const pwdHash = await argon.hash(dto.password);
    // console.log(dto);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: pwdHash,
          name: dto.name
        },
      });

      // await this.sendMailVerification(user);
      // return user;
    } catch (error) {
      if ( error instanceof Prisma.PrismaClientKnownRequestError ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'There is a unique constraint violation, a new user cannot be created with this email'
          );
        }
      }
      throw error;
    }
  }

  async signToken(userId: string, email: string): Promise<{ status: number, message: string, access_token: string }> {
    const payload = {
      sub: userId,
      email
    };

    const accessToken = await this.jwt.signAsync(
      payload,
      {
        secret: JWT_CONST.secret,
        expiresIn: JWT_CONST.expired
      }
    );

    const status: Number = HttpStatus.OK;
      
    return {
      status: HttpStatus.OK,
      message: "Login successfully",
      access_token: accessToken
    };
  }

  // async sendMailVerification (user: User) {
  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: 'Welcome to Nice App! Confirm Email',
  //     template: 'confirm',
  //     context: {
  //       // 'abc',
  //       code: Math.floor(10000 + Math.random() * 90000)
  //     },
  //   });
  // }
}
