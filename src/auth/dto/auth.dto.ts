import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean
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
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  avatar: string;

  @IsString()
  skills: string;

  @IsString()
  rating: string;

  @IsInt()
  role: number;

  @IsString()
  position: Int32Array;

  @IsString()
  teamId: string;

  @IsString()
  tournamentIds: object;

  @IsBoolean()
  isVerified: Boolean;
}
