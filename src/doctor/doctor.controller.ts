import {Controller,Get,Request,UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('doctor')
export class DoctorController {

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  getDoctorProfile(@Request() req) {
    return {
      message: 'Welcome Doctor',
      user: req.user,
    };
  }
}