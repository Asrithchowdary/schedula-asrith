import {Controller,Post,Get,Patch,Body,Request,UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientService } from './patient.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('patient')
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PATIENT')
  createProfile(@Body() body: any, @Request() req) {
    return this.patientService.createProfile(
      body,
      req.user,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PATIENT')
  getProfile(@Request() req) {
    return this.patientService.getProfile(
      req.user,
    );
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PATIENT')
  updateProfile(
    @Body() body: any,
    @Request() req,
  ) {
    return this.patientService.updateProfile(
      body,
      req.user,
    );
  }
}