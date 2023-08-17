import { IsString, IsOptional } from 'class-validator';
import { IUserSkill } from '../interface/userSkill.interface';

export class updateUserDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  avatar: string;

  @IsOptional()
  skills: IUserSkill[];

  @IsString()
  @IsOptional()
  password: string;
}
