import { IsString, IsOptional, IsNotEmpty, IsArray } from 'class-validator';
import { CreateTeamDto } from './createTeam.dto';
import { PartialType } from '@nestjs/swagger';

export class updateTeamDto extends PartialType(CreateTeamDto) {
  @IsOptional()
  @IsArray()
  matchIds: string[];
}
