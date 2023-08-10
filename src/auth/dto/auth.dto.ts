import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional
} from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
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
  rating: string;

  @IsInt()
  @IsOptional()
  role: number;

  @IsString()
  @IsOptional()
  position: Int32Array;

  @IsString()
  @IsOptional()
  teamId: string;

  @IsString()
  @IsOptional()
  tournamentIds: object;

  @IsBoolean()
  @IsOptional()
  isVerified: Boolean;
}
