import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { TeamService } from './team.service';
import { TeamDto } from './dto/team.dto';

@UseGuards(JwtGuard)
@Controller('team')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post('create-team')
  createTeam(@Body() dto: TeamDto) {
    return this.teamService.createTeam(dto);
  }

  @Patch('update-team')
  updateTeam(@Body() dto: TeamDto) {
    return this.teamService.updateTeam(dto);
  }

  @Patch('add-member')
  addMember(@Body() dto: TeamDto) {
    return this.teamService.addMember();
  }
}
