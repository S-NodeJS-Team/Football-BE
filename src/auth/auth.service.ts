import { ForbiddenException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
        is_verified: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Email is not exist');
    }

    if (!user.is_verified) {
      throw new ForbiddenException('Your account is not verified');
    }

    const pwdMatches = await argon.verify(user.password, dto.password);

    if (!pwdMatches) {
      throw new ForbiddenException('Your password was wrong');
    }

    return await this.signToken(user.id, user.email);
  }

  async signUp(dto: AuthDto) {
    const pwdHash = await argon.hash(dto.password);
    const randomNumber = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      const checkUserExist = await this.prisma.user.findUnique({
        where: {
          email: dto.email
        }
      });

      if (!checkUserExist) {
        const user = await this.prisma.user.create({
          data: {
            email: dto.email,
            password: pwdHash,
            name: dto.name,
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
          message: 'Verify account link is sent to your email',
          data: user,
        };
      } else {
        const verifyLink = await this.prisma.verifyLink.findUnique({
          where: {userId: checkUserExist.id}
        });

        if (verifyLink) {
          try{
            await this.jwt.verify(verifyLink.verifyToken, {
              secret: JWT_CONST.secret,
              ignoreExpiration: false,
            });

            return {
              code: HttpStatus.OK,
              message: 'Your account has been registered, please check mail to verify account'
            }
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
              where : {
                id: verifyLink.id,
              }
            });

            await this.mailer.sendMailVerification(checkUserExist, verifyToken);

            return {
              code: HttpStatus.OK,
              message: 'Your account not verified, please check mail to verify account'
            }
          }
        }
      }
      console.log(checkUserExist);
    } catch (error) {
      // if (error instanceof Prisma.PrismaClientKnownRequestError) {
      //   console.log(error);
      //   if (error.code === 'P2002') {
      //     throw new ForbiddenException(
      //       'There is a unique constraint violation, a new user cannot be created with this email',
      //     );
      //   }
      // }
      throw new InternalServerErrorException(error.message);
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

    return {
      status: HttpStatus.OK,
      message: 'Login successfully',
      access_token: accessToken,
    };
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

      await this.prisma.verifyLink.update({
        where: {
          userId: userId,
        },
        data: {
          verifyToken: null,
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
        throw new InternalServerErrorException(error.message)
      }
    }
  }
}
