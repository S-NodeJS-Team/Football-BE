import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { updateUserDto } from './dto/updateUser.dto';
import { USER_MSG } from 'src/common/constant';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';

@Injectable({})
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateUser(user: User, dto: updateUserDto) {
    try {
      if (dto.password) {
        const pwdHash = await argon.hash(dto.password);

        dto.password = pwdHash;
      }

      const newUser = await this.prisma.user.update({
        data: dto,
        where: { id: user.id },
      });

      return {
        code: HttpStatus.OK,
        message: USER_MSG.updateUserSuccess,
        data: {
          user: newUser,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
