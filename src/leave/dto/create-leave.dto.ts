import { IsDateString,IsOptional, IsString,MaxLength, } from "class-validator";

export class CreateLeaveDto{
    @IsDateString()
    leaveDate: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    reason?: string;
}
