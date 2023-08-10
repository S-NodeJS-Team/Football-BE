import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsInt,
    IsBoolean
  } from 'class-validator';

export class verifyLinkDto{
    @IsString()
    @IsNotEmpty()
    verifyToken: string;

    @IsString()
    @IsNotEmpty()
    userId: string
}