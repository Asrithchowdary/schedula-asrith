import { IsDateString, IsOptional, IsString,MaxLength, } from "class-validator";

export class UpdateLeaveDto{
    @IsOptional()
    @IsDateString()
    leaveDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    reason?: string;
}