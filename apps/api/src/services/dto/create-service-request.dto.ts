import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Cumpleaños 30 años' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: 'Salón Las Condes' })
  @IsOptional()
  @IsString()
  eventPlace?: string;

  @ApiPropertyOptional({ example: [1, 3], type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  optionIds?: number[];
}
