import {Controller,Post,Get,Patch,Body,Request,UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('doctor')
export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  @Post('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  createProfile(@Body() body: any, @Request() req) {
    return this.doctorService.createProfile(
      body,
      req.user,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR')
  getProfile(@Request() req) {
    return this.doctorService.getProfile(
      req.user,
    );
  }

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
}