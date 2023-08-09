import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon from 'argon2';
import { JWT_CONST } from 'src/common/constant';
import { MailerService } from 'src/mailer/mailer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
  ) {}
  async signIn(dto: AuthDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Email is not exist',
        access_token: '',
      };
    }

    const pwdMatches = await argon.verify(user.password, dto.password);

    if (!pwdMatches) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Your password was wrong',
        access_token: '',
      };
    }

    return this.signToken(user.id, user.email);
  }

  async signUp(dto: AuthDto) {
    const pwdHash = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: pwdHash,
          name: dto.name,
        },
      });

      const randomNumber = Math.floor(1000 + Math.random() * 9000).toString();
      const tokenPayload = {
        sub: user.id,
        randomNumber,
      };
      const verifyToken = await this.jwt.signAsync(tokenPayload, {
        secret: JWT_CONST.secret,
        expiresIn: JWT_CONST.expired,
      });

      const verifyLink = await this.prisma.verifyLink.create({
        data: {
          userId: user.id,
          verifyToken: verifyToken,
        },
      });

      await this.mailer.sendMailVerification(user, verifyToken);

      return {
        message: 'Verify account link is sent to your email',
        data: user,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'There is a unique constraint violation, a new user cannot be created with this email',
          );
        }
      }
      throw error;
    }
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ status: number; message: string; access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: JWT_CONST.secret,
      expiresIn: JWT_CONST.expired,
    });

    const status: Number = HttpStatus.OK;

    return {
      status: HttpStatus.OK,
      message: 'Login successfully',
      access_token: accessToken,
    };
  }

  async confirmEmailVerification(token: string) {
    const decodedJwtAccessToken = this.jwt.decode(token);
    const expiredLink = decodedJwtAccessToken['exp'];
    const userId = decodedJwtAccessToken['sub'];

    try {
      const checkToken = await this.jwt.verify(token, {
        secret: JWT_CONST.secret,
        ignoreExpiration: false,
      });

      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          is_verified: true
        }
      });

      await this.prisma.verifyLink.update({
        where: {
          userId: userId,
        },
        data: {
          verifyToken: null
        }
      });

      return {
        code: HttpStatus.OK,
        message: 'User verify successfully'
      }
    } catch (error) {
      return {
        code: error === 'jwt expired' ? HttpStatus.UNAUTHORIZED : HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
