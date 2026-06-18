import {Controller,Get,Request,UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('patient')
export class PatientController {
  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('PATIENT')
  getPatientProfile(@Request() req) {
    return {
      message: 'Welcome Patient',
      user: req.user,
    };
  }
}