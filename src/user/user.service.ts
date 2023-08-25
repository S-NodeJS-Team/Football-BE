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
import { createQueryObject } from 'src/common/utils/paginate-document.util';
import { IUserFilter, IUserQuery } from './interface/user-query.interface';

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
          player: newUser,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPlayers(queryObj: IUserQuery, filterObj: IUserFilter) {
    try {
      const { fields, queryObject, queryOptions, sort } =
        createQueryObject(queryObj);

      const condition: any = {
        ...queryObject,
        is_verified: true,
      };

      if (filterObj.positions) {
        condition.position = {
          hasSome: filterObj.positions,
        };
      }

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

  async getPlayer(playerId: string) {
    try {
      const currPlayer = await this.prisma.user.findFirst({
        where: {
          id: playerId,
          is_verified: true,
        },
      });

      const { password, role, is_verified, ...result } = currPlayer;

      return {
        code: HttpStatus.OK,
        data: {
          player: result,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
