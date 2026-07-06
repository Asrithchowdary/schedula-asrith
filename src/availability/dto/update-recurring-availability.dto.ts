import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateRecurringAvailabilityDto {
  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  allowFutureBooking?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxFutureBookingDays?: number;
}