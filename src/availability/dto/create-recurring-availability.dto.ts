import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SchedulingType } from '../enums/scheduling-type.enum';

export class CreateRecurringAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsEnum(SchedulingType)
  schedulingType: SchedulingType;

  @IsOptional()
  @IsInt()
  @Min(1)
  slotDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;
}