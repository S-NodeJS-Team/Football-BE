import { IsString, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString({ each: true })
  galleryImages: string[];

  @IsOptional()
  @IsString()
  logo: string;
}
