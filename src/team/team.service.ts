import {
  Injectable,
  HttpStatus,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/createTeam.dto';
import { TEAM_MSG } from 'src/common/constant';
import { updateTeamDto } from './dto/updateTeam.dto';
import slugify from 'slugify';
import { createQueryObject } from 'src/common/utils/paginate-document.util';
import { User } from '@prisma/client';
import { ITeamQuery } from './interface/team-query.interface';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}
  async createTeam(dto: CreateTeamDto, user: User) {
    try {
      const newData = {
        ...dto,
        slug: slugify(dto.name, { lower: true }),
        ownerId: user.id
      };

      const teamAdded = await this.prisma.team.create({
        data: newData,
      });

      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.addTeamSuccess,
        data: {
          team: teamAdded,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateTeam(teamSlug: string, dto: updateTeamDto) {
    try {
      const newSlug = dto.name ? slugify(dto.name) : teamSlug;
      const newTeam = await this.prisma.team.update({
        data: {
          ...dto,
          slug: newSlug,
        },
        where: { slug: teamSlug },
      });

      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.updateTeamSuccess,
        data: {
          team: newTeam,
        },
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ForbiddenException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  async addMember(dto: CreateTeamDto) {
    try {
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getTeam(slugTeam: string) {
    if (!slugTeam) {
      throw new ForbiddenException(TEAM_MSG.notFoundTeam);
    }

    const team = await this.prisma.team.findUnique({
      where: { slug: slugTeam },
    });

    if (!team) {
      throw new ForbiddenException(TEAM_MSG.notFoundTeam);
    } else {
      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.getTeamSuccess,
        data: {
          team: team,
        },
      };
    }
  }

  async getTeams(queryObj: ITeamQuery) {
    try {
      const { fields, queryObject, queryOptions, sort } =
        createQueryObject(queryObj);

      const condition: any = queryObject;
      // console.log(fields);

      // if (filterObj.positions) {
      //   condition.position = {
      //     hasSome: filterObj.positions,
      //   };
      // }

      const { skip, take } = queryOptions;
      const teams = await this.prisma.team.findMany({
        orderBy: sort,
        skip,
        take,
        where: condition,
        select: fields,
      });
      const countDocuments = await this.prisma.team.count({
        where: condition,
      });

      return {
        code: HttpStatus.OK,
        data: {
          teams,
          count: countDocuments,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
