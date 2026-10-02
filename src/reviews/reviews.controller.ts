import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, AuthenticatedUser } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ComplaintStatus } from './entities/complaint.entity';
import { ReviewStatus } from './entities/review.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateComplaintDto } from './dto/moderate-complaint.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewsService } from './reviews.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PASAJERO, UserRole.CONDUCTOR)
  createReview(@Req() req: AuthRequest, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, req.user.rol, dto);
  }

  @Post('complaints')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.PASAJERO, UserRole.CONDUCTOR)
  createComplaint(@Req() req: AuthRequest, @Body() dto: CreateComplaintDto) {
    return this.reviewsService.createComplaint(req.user.id, dto);
  }

  @Get('reviews/user/:userId')
  listApprovedReviewsForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviewsService.listApprovedReviewsForUser(userId);
  }

  @Get('admin/reviews/pending')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listPendingReviews() {
    return this.reviewsService.listPendingReviews();
  }

  @Patch('admin/reviews/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  moderateReview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderateReview(id, dto.status);
  }

  @Get('admin/complaints')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listComplaints(@Query('status') status?: ComplaintStatus) {
    return this.reviewsService.listComplaints(status);
  }

  @Patch('admin/complaints/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  moderateComplaint(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModerateComplaintDto) {
    return this.reviewsService.moderateComplaint(id, dto.status);
  }
}
