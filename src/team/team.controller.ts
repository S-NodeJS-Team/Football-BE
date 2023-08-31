import {
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  Get,
  Param,
  Query
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/createTeam.dto';
import { updateTeamDto } from './dto/updateTeam.dto';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { ITeamQuery } from './interface/team-query.interface';

@UseGuards(JwtGuard)
@Controller('team')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post('create-team')
  createTeam(@Body() dto: CreateTeamDto, @GetUser() user: User) {
    return this.teamService.createTeam(dto, user);
  }

  @Patch(':teamSlug')
  updateTeam(@Param() params, @Body() dto: updateTeamDto) {
    return this.teamService.updateTeam(params.teamSlug, dto);
  }

  @Patch('add-member')
  addMember(@Body() dto: CreateTeamDto) {
    return this.teamService.addMember(dto);
  }

  @Get(':slug')
  getTeam(@Param() param) {
    const slugTeam = param.slug;
    return this.teamService.getTeam(slugTeam);
  }

  @Get('get-teams')
  getTeams(@Query() queryObj: ITeamQuery) {
    return this.teamService.getTeams(queryObj);
  }
}
