import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, VerifyLink } from '@prisma/client';
import * as argon from 'argon2';
import { AUTH_MSG, END_POINT, JWT_CONST } from 'src/common/constant';
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
      const endPoint = '/auth/verify-account';
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

        const verifyToken = await this.createVerifyLink(user, tokenPayload);
        await this.mailer.sendMailVerification(user, verifyToken, endPoint);

        return {
          code: HttpStatus.OK,
          message: AUTH_MSG.mailCheckMsg.registeredAccount,
          data: user,
        };
      } else {
        if (!checkUserExist.is_verified) {
          const tokenPayload = { sub: checkUserExist.id, randomNumber };
          const verifyLink = await this.prisma.verifyLink.findUnique({
            where: { userId: checkUserExist.id },
          });
          return await this.updateVerifyLink(
            checkUserExist,
            tokenPayload,
            verifyLink,
            endPoint,
          );
        } else {
          return {
            code: HttpStatus.OK,
            message: AUTH_MSG.accountVerified,
          };
        }
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
        message: AUTH_MSG.accountVerifySuccess,
      };
    } catch (error) {
      if (error === 'jwt expired') {
        throw new UnauthorizedException(AUTH_MSG.urlExpired);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async forgotPassword(email: string) {
    const endPoint = END_POINT.resetPassword;
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (user) {
        if (!user.is_verified) {
          throw new ForbiddenException(AUTH_MSG.accountNotVerified);
        }

        const tokenPayload = { sub: user.email };
        const verifyLink = await this.prisma.verifyLink.findUnique({
          where: {
            userId: user.id,
          },
        });

        if (verifyLink) {
          return await this.updateVerifyLink(
            user,
            tokenPayload,
            verifyLink,
            endPoint,
          );
        } else {
          const verifyToken = await this.createVerifyLink(user, tokenPayload);
          await this.mailer.sendMailVerification(user, verifyToken, endPoint);
          return {
            code: HttpStatus.OK,
            message: AUTH_MSG.mailCheckMsg.forgotAccount,
          };
        }
      } else {
        throw new ForbiddenException(AUTH_MSG.accountNotRegistered);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createVerifyLink(user: User, payload: any) {
    const verifyToken = await this.jwt.signAsync(payload, {
      secret: JWT_CONST.secret,
      expiresIn: JWT_CONST.expired,
    });

    await this.prisma.verifyLink.create({
      data: {
        userId: user.id,
        verifyToken: verifyToken,
      },
    });

    return verifyToken;
  }

  async updateVerifyLink(
    user: User,
    payload: any,
    verifyLink: VerifyLink,
    endPoint: string,
  ) {
    let urlMsgAvailable = AUTH_MSG.urlMsgAvailable.registeredAccount;
    let mailCheckMsg = AUTH_MSG.mailCheckMsg.registeredAccount;

    if (endPoint === END_POINT.resetPassword) {
      urlMsgAvailable = AUTH_MSG.urlMsgAvailable.forgotAccount;
      mailCheckMsg = AUTH_MSG.mailCheckMsg.forgotAccount;
    }

    try {
      await this.jwt.verify(verifyLink.verifyToken, {
        secret: JWT_CONST.secret,
        ignoreExpiration: false,
      });

      return {
        code: HttpStatus.OK,
        message: urlMsgAvailable,
      };
    } catch (error) {
      const verifyToken = await this.jwt.signAsync(payload, {
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

      await this.mailer.sendMailVerification(user, verifyToken, endPoint);

      return {
        code: HttpStatus.OK,
        message: mailCheckMsg,
      };
    }
  }

  async resetPassword(newPass: string, token: string) {
    try {
      const validToken = await this.prisma.verifyLink.findFirst({
        where: { verifyToken: token },
      });

      if (!validToken) {
        throw new ForbiddenException(AUTH_MSG.invalidToken);
      }

      const decodedJwtAccessToken = this.jwt.decode(token);
      const email = decodedJwtAccessToken['sub'];

      await this.jwt.verify(token, {
        secret: JWT_CONST.secret,
        ignoreExpiration: false,
      });

      const newPassHash = await argon.hash(newPass);
      await this.prisma.user.update({
        data: { password: newPassHash },
        where: { email: email },
      });

      await this.prisma.verifyLink.deleteMany({
        where: { verifyToken: token },
      });

      return {
        code: HttpStatus.OK,
        message: AUTH_MSG.passwordChangeSuccess,
      };
    } catch (error) {
      if (error === 'jwt expired') {
        throw new UnauthorizedException(AUTH_MSG.urlExpired);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
