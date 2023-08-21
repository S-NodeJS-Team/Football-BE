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
import { IQueryObject } from 'src/common/interface';
import { createQueryObject } from 'src/common/utils/paginate-document.util';

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

  async getPlayers(queryObj: IQueryObject) {
    try {
      const { fields, queryObject, queryOptions, sort } =
        createQueryObject(queryObj);
      const condition = {
        ...queryObject,
        is_verified: true,
      };

      const { skip, take } = queryOptions;
      const players = await this.prisma.user.findMany({
        orderBy: sort,
        skip,
        take,
        where: condition,
        select: fields,
      });
      const countDocuments = await this.prisma.user.count({
        where: condition,
      });

      return {
        code: HttpStatus.OK,
        data: {
          players,
          count: countDocuments,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
