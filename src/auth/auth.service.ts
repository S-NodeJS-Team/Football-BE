import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { JWT_CONST } from 'src/common/constant';
import { MailerService } from 'src/mailer/mailer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { SignInDto } from './dto/signIn.dto';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
  ) {}
  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        is_verified: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Email is not exist');
    }

    const pwdMatches = await argon.verify(user.password, dto.password);

    if (!pwdMatches) {
      throw new ForbiddenException('Your password was wrong');
    }

    const access_token = await this.signToken(user.id, user.email);
    const { password, role, is_verified, ...userData } = user;

    return {
      code: HttpStatus.OK,
      message: 'Login successfully',
      data: {
        user: userData,
        access_token,
      },
    };
  }

  async signUp(dto: AuthDto) {
    try {
      const pwdHash = await argon.hash(dto.password);
      const randomNumber = Math.floor(1000 + Math.random() * 9000).toString();
      const checkUserExist = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!checkUserExist) {
        const user = await this.prisma.user.create({
          data: {
            email: dto.email,
            password: pwdHash,
            name: dto.name,
            phoneNumber: dto.phoneNumber,
          },
        });

        const tokenPayload = {
          sub: user.id,
          randomNumber,
        };
        const verifyToken = await this.jwt.signAsync(tokenPayload, {
          secret: JWT_CONST.secret,
          expiresIn: JWT_CONST.expired,
        });

        await this.prisma.verifyLink.create({
          data: {
            userId: user.id,
            verifyToken: verifyToken,
          },
        });

        await this.mailer.sendMailVerification(user, verifyToken);
        return {
          code: HttpStatus.OK,
          message: 'Verify account link is sent to your email',
          data: user,
        };
      }

      if (checkUserExist && !checkUserExist.is_verified) {
        const verifyLink = await this.prisma.verifyLink.findUnique({
          where: { userId: checkUserExist.id },
        });

        if (verifyLink) {
          try {
            await this.jwt.verify(verifyLink.verifyToken, {
              secret: JWT_CONST.secret,
              ignoreExpiration: false,
            });

            return {
              code: HttpStatus.OK,
              message:
                'Your account has been registered, please check mail to verify account',
            };
          } catch (error) {
            const tokenPayload = {
              sub: verifyLink.userId,
              randomNumber,
            };
            const verifyToken = await this.jwt.signAsync(tokenPayload, {
              secret: JWT_CONST.secret,
              expiresIn: JWT_CONST.expired,
            });

            await this.prisma.verifyLink.update({
              data: {
                verifyToken: verifyToken,
              },
              where: {
                id: verifyLink.id,
              },
            });

            await this.mailer.sendMailVerification(checkUserExist, verifyToken);

            return {
              code: HttpStatus.OK,
              message:
                'Your account not verified, please check mail to verify account',
            };
          }
        }
      } else {
        return {
          code: HttpStatus.OK,
          message: 'Your account has been verified',
        };
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: JWT_CONST.secret,
      expiresIn: JWT_CONST.expired,
    });

    return accessToken;
  }

  async confirmEmailVerification(token: string) {
    const decodedJwtAccessToken = this.jwt.decode(token);
    const userId = decodedJwtAccessToken['sub'];

    try {
      await this.jwt.verify(token, {
        secret: JWT_CONST.secret,
        ignoreExpiration: false,
      });

      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          is_verified: true,
        },
      });

      await this.prisma.verifyLink.delete({
        where: {
          userId: userId,
        },
      });

      return {
        code: HttpStatus.OK,
        message: 'User verify successfully',
      };
    } catch (error) {
      if (error === 'jwt expired') {
        throw new UnauthorizedException('Your link activation expired');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
