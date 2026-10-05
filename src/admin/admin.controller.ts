import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResolvePaymentReportDto } from './dto/resolve-payment-report.dto';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/guards/auth.guard';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/role')
  async changeUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(id, changeRoleDto.rol);
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Get('vehicles')
  async getAllVehicles() {
    return this.adminService.getAllVehicles();
  }

  @Get('trips')
  async getAllTrips() {
    return this.adminService.getAllTrips();
  }

  @Get('payments/reported')
  async getReportedPayments() {
    return this.adminService.getReportedPayments();
  }

  @Patch('payments/:id/report')
  async resolvePaymentReport(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolvePaymentReportDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.adminService.resolveReportedPayment(id, req.user.id, dto.action);
  }
}
