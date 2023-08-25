import { Injectable, HttpStatus, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/createTeam.dto';
import { TEAM_MSG } from 'src/common/constant';
import { updateTeamDto } from './dto/updateTeam.dto';
import slugify from 'slugify';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}
  async createTeam(dto: CreateTeamDto) {
    try {
      dto.slug = slugify(dto.name, {lower: true});
      const teamAdded = await this.prisma.team.create({
        data: dto
      });

      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.addTeamSuccess,
        data: {
          team: teamAdded
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateTeam(dto: updateTeamDto) {
    try {
      if (dto.name) {
        dto.slug = slugify(dto.name);
      }
      const newTeam = await this.prisma.team.update({
        data: dto,
        where: {slug: dto.slug}
      });

      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.updateTeamSuccess,
        data: {
          team: newTeam
        }
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

  async getTeam(slugTeam: string){
    if (!slugTeam) {
      throw new ForbiddenException(TEAM_MSG.notFoundTeam);
    }

    const team = await this.prisma.team.findUnique({
      where: {slug: slugTeam}
    });

    if (!team) {
      throw new ForbiddenException(TEAM_MSG.notFoundTeam);
    } else {
      return {
        code: HttpStatus.OK,
        message: TEAM_MSG.getTeamSuccess,
        data: {
          team: team
        }
      };
    }
  }
  
  async getTeams(){

  }
}
