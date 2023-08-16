import { IsString, IsOptional } from 'class-validator';

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

  @IsString()
  @IsOptional()
  skills: string;

  @IsString()
  @IsOptional()
  password: string;
}
