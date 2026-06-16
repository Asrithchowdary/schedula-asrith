import {Controller,Post,Body,Get,Param,Patch,} from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @Post()
  createAppointment(
    @Body() body: any,
  ) {
    return this.appointmentService.createAppointment(
      body.patientId,
      body,
    );
  }

  @Get('my/:patientId')
  getMyAppointments(
    @Param('patientId') patientId: number,
  ) {
    return this.appointmentService.getMyAppointments(
      Number(patientId),
    );
  }

  @Get('doctor/:doctorId')
  getDoctorAppointments(
    @Param('doctorId') doctorId: number,
  ) {
    return this.appointmentService.getDoctorAppointments(
      Number(doctorId),
    );
  }

  @Patch(':id/cancel')
  cancelAppointment(
    @Param('id') id: number,
  ) {
    return this.appointmentService.cancelAppointment(
      Number(id),
    );
  }
}