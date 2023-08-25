import { Body, Controller, Patch, Post, UseGuards, Get, Param } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/createTeam.dto';
import { updateTeamDto } from './dto/updateTeam.dto';

@UseGuards(JwtGuard)
@Controller('team')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post('create-team')
  createTeam(@Body() dto: CreateTeamDto) {
    return this.teamService.createTeam(dto);
  }

  @Patch('update-team')
  updateTeam(@Body() dto: updateTeamDto) {
    return this.teamService.updateTeam(dto);
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
}
