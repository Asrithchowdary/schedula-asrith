import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { SlotService } from './slot.service';

@Controller('doctor')
export class SlotController {
  constructor(
    private readonly slotService: SlotService,
  ) {}

  @Get(':doctorId/slots')
  getSlots(
    @Param('doctorId')
    doctorId: number,

    @Query('date')
    date: string,

    @Query('duration')
    duration = 15,
  ) {
    return this.slotService.getSlots(
      Number(doctorId),
      date,
      Number(duration),
    );
  }
}