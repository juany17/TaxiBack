import { Request } from 'express';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req: AuthRequest, @Body() createTripDto: CreateTripDto) {
    const passengerId = req.user.id;
    return this.tripsService.create(passengerId, createTripDto);
  }

  @Get('pending')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CONDUCTOR)
  async findPending() {
    return this.tripsService.findPending();
  }

  @Get('my-trips')
  @UseGuards(AuthGuard)
  async findMyTrips(@Req() req: AuthRequest) {
    const userId = req.user.id;
    const role = req.user.rol;

    if (role === UserRole.CONDUCTOR) {
      return this.tripsService.findByDriver(userId);
    }
    return this.tripsService.findByPassenger(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findById(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tripsService.findByIdForUser(id, { id: req.user.id, rol: req.user.rol });
  }

  @Post(':id/accept')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CONDUCTOR)
  async accept(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const driverId = req.user.id;
    return this.tripsService.accept(id, driverId);
  }

  @Post(':id/complete')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CONDUCTOR)
  async complete(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.tripsService.complete(id, req.user.id);
  }
}