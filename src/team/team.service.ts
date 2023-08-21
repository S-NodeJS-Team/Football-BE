import { Injectable, HttpStatus, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamDto } from './dto/team.dto';
import { TEAM_MSG } from 'src/common/constant';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}
  async createTeam(dto: TeamDto) {
    try {
      const teamAdded = await this.prisma.team.create({
        data: dto
      });

      return {
        code: HttpStatus.OK,
        message: '',
        data: teamAdded
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateTeam(dto: TeamDto) {
    try {
      if (!dto.id) {
        throw new ForbiddenException(TEAM_MSG.notFoundTeamId);
      }

      const { id, ...dataUpdate } = dto;

      const newTeam = await this.prisma.team.update({
        data: dataUpdate,
        where: {id: dto.id}
      });

      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.updateTeamSuccess,
        data: {
          team: newTeam
        }
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async addMember() {}
}
