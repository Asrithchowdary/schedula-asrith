import {Controller,Post,Get,Patch,Body,Request,UseGuards,Query,Param,ParseIntPipe,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
  ) {}

  // Create Doctor Profile
  @Post('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  createProfile(
    @Body() body: any,
    @Request() req,
  ) {
    return this.doctorService.createProfile(
      body,
      req.user,
    );
  }

  // Get Logged In Doctor Profile
  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  getProfile(@Request() req) {
    return this.doctorService.getProfile(
      req.user,
    );
  }

  // Update Logged In Doctor Profile
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  updateProfile(
    @Body() body: any,
    @Request() req,
  ) {
    return this.doctorService.updateProfile(
      body,
      req.user,
    );
  }

  // Doctor Discovery API
  @Get()
  getDoctors(
    @Query('specialization')
    specialization?: string,

    @Query('search')
    search?: string,

    @Query('availability')
    availability?:string,

    @Query('page')
    page = 1,

    @Query('limit')
    limit = 10,
  ) {
    return this.doctorService.getDoctors(
      specialization,
      search,
      availability,
      Number(page),
      Number(limit),
    );
  }

  // Get Doctor Details By ID
  @Get(':id')
  getDoctorById(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.doctorService.getDoctorById(id);
  }
  
  @Get(':doctorId/availability')
getDoctorAvailability(
  @Param('doctorId', ParseIntPipe)
  doctorId: number,
) {
  return this.doctorService.getDoctorAvailability(
    doctorId,
  );
}
@Get('appointments')
getDoctorAppointments(
  @Query('doctorId') doctorId: number,
  @Query('date') date?: string,
) {
  return this.doctorService.getDoctorAppointments(
    Number(doctorId),
    date,
  );
}
@Patch('appointments/:id/cancel')
cancelAppointment(
  @Param('id') id: number,
  @Query('doctorId') doctorId: number,
) {
  return this.doctorService.cancelDoctorAppointment(
    Number(id),
    Number(doctorId),
  );
}
}