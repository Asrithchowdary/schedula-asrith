import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability.service';
import { RolesGuard } from '../auth/roles.guard';

@Controller('doctor/availability')

@UseGuards(AuthGuard('jwt'),RolesGuard,)
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Post()
  createRecurring(
    @Body() body: any,
    @Request() req,
  ) {
    return this.availabilityService.createRecurring(
      body,
      req.user.userId,
    );
  }

  @Get()
  getRecurring(
    @Request() req,
  ) {
    return this.availabilityService.getRecurring(
      req.user.userId,
    );
  }

  @Patch(':id')
  updateRecurring(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
    @Body() body: any,
  ) {
    return this.availabilityService.updateRecurring(
      id,
      body,
    );
  }

  @Delete(':id')
  deleteRecurring(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.availabilityService.deleteRecurring(
      id,
    );
  }

  @Post('override')
  createOverride(
    @Body() body: any,
    @Request() req,
  ) {
    return this.availabilityService.createOverride(
      body,
      req.user.userId,
    );
  }

  @Get('date')
  getAvailabilityByDate(
    @Query('date')
    date: string,

    @Request() req,
  ) {
    return this.availabilityService.getAvailabilityByDate(
      date,
      req.user.userId,
    );
  }
}