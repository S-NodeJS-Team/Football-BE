import {
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class TeamDto {
  @IsOptional()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  galleryImages: string[];

  @IsOptional()
  @IsString()
  logo: string;

  @IsOptional()
  matchIds: string[];
}
