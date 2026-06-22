import {Controller,Post,Body,Get,Param,Patch,Query} from '@nestjs/common';
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
    @Query('date')date?:string,
  ) {
    return this.appointmentService.getDoctorAppointments(
      Number(doctorId),
      date,
    );
  }
 @Get('next-available/:doctorId')
getNextAvailable(
  @Param('doctorId') doctorId: number,
) {
  return this.appointmentService.getNextAvailable(
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

  @Patch(':id/reschedule')
rescheduleAppointment(
  @Param('id') id: number,
  @Body() body: any,
) {
  return this.appointmentService.rescheduleAppointment(
    Number(id),
    body,
  );
 }

}