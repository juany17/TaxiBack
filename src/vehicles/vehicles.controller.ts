import { Controller, Post, Body, Param, Get, Req, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AuthGuard, AuthenticatedUser } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('vehicles')
@UseGuards(AuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post(':conductorId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONDUCTOR, UserRole.ADMIN)
  async create(
    @Req() req: AuthRequest,
    @Param('conductorId', new ParseUUIDPipe()) conductorId: string,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(conductorId, createVehicleDto, {
      id: req.user.id,
      rol: req.user.rol,
    });
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    return this.vehiclesService.findAllFor({ id: req.user.id, rol: req.user.rol });
  }
}
