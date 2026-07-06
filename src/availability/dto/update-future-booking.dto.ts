import { IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateFutureBookingDto {

  @IsBoolean()
  allowFutureBooking: boolean;

  @IsInt()
  @Min(0)
  maxFutureBookingDays: number;

}