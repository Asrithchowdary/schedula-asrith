import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';

import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Controller('doctor/leave')
export class LeaveController {
  constructor(
    private readonly leaveService: LeaveService,
  ) {}

  @Post()
    createLeave(
    @Body() body: any,
    ) {
    return this.leaveService.createLeave(
     body.doctorId,
     body,
     );
    }

  @Get(':doctorId')
  getMyLeaves(
    @Param('doctorId') doctorId: number,
  ) {
    return this.leaveService.getMyLeaves(
      Number(doctorId),
    );
  }

  @Patch(':leaveId/:doctorId')
  updateLeave(
    @Param('leaveId') leaveId: number,
    @Param('doctorId') doctorId: number,
    @Body() dto: UpdateLeaveDto,
  ) {
    return this.leaveService.updateLeave(
      Number(leaveId),
      Number(doctorId),
      dto,
    );
  }

  @Delete(':leaveId/:doctorId')
  deleteLeave(
    @Param('leaveId') leaveId: number,
    @Param('doctorId') doctorId: number,
  ) {
    return this.leaveService.deleteLeave(
      Number(leaveId),
      Number(doctorId),
    );
  }
}