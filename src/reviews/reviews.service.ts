import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripEntity, TripStatus } from '../trips/entities/trip.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { ComplaintEntity, ComplaintStatus } from './entities/complaint.entity';
import { ReviewEntity, ReviewStatus } from './entities/review.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity) private readonly reviews: Repository<ReviewEntity>,
    @InjectRepository(ComplaintEntity) private readonly complaints: Repository<ComplaintEntity>,
    @InjectRepository(TripEntity) private readonly trips: Repository<TripEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async createReview(authorId: string, authorRole: UserRole, dto: CreateReviewDto) {
    const trip = await this.trips.findOne({ where: { id: dto.tripId } });
    if (!trip || trip.status !== TripStatus.FINALIZADO) {
      throw new BadRequestException('Solo se puede reseñar un viaje finalizado');
    }
    const subjectId = this.getOtherParticipant(trip, authorId, authorRole);
    if (!subjectId) throw new BadRequestException('No participaste en este viaje');
    if (await this.reviews.exists({ where: { trip_id: dto.tripId, author_id: authorId } })) {
      throw new ConflictException('Ya enviaste una reseña para este viaje');
    }
    return this.reviews.save(
      this.reviews.create({
        trip_id: trip.id,
        author_id: authorId,
        subject_id: subjectId,
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDIENTE,
      }),
    );
  }

  async createComplaint(reporterId: string, dto: CreateComplaintDto) {
    let trip: TripEntity | null = null;
    if (dto.tripId) {
      trip = await this.trips.findOne({ where: { id: dto.tripId } });
      if (!trip) throw new NotFoundException('Viaje no encontrado');
      if (trip.passenger_id !== reporterId && trip.driver_id !== reporterId) {
        throw new BadRequestException('No participaste en este viaje');
      }
    }
    const reportedUserId = trip
      ? trip.passenger_id === reporterId
        ? trip.driver_id
        : trip.passenger_id
      : null;
    return this.complaints.save(
      this.complaints.create({
        trip_id: dto.tripId ?? null,
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason: dto.reason,
        description: dto.description,
        status: ComplaintStatus.PENDIENTE,
      }),
    );
  }

  listPendingReviews() {
    return this.reviews.find({
      where: { status: ReviewStatus.PENDIENTE },
      relations: { trip: true, author: true, subject: true },
      order: { createdAt: 'ASC' },
    });
  }

  listApprovedReviewsForUser(subjectId: string) {
    return this.reviews.find({
      where: { subject_id: subjectId, status: ReviewStatus.APROBADA },
      relations: { author: true, trip: true },
      order: { createdAt: 'DESC' },
    });
  }

  listComplaints(status?: ComplaintStatus) {
    return this.complaints.find({
      where: status ? { status } : {},
      relations: { trip: true, reporter: true, reportedUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  async moderateReview(id: string, status: ReviewStatus.APROBADA | ReviewStatus.RECHAZADA) {
    const review = await this.reviews.findOne({ where: { id }, relations: { subject: true } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (review.status !== ReviewStatus.PENDIENTE) {
      throw new BadRequestException('La reseña ya fue moderada');
    }
    review.status = status;
    const saved = await this.reviews.save(review);
    if (status === ReviewStatus.APROBADA) await this.refreshAverage(review.subject_id);
    return saved;
  }

  async moderateComplaint(id: string, status: ComplaintStatus.REVISADA | ComplaintStatus.DESCARTADA) {
    const complaint = await this.complaints.findOne({ where: { id } });
    if (!complaint) throw new NotFoundException('Denuncia no encontrada');
    complaint.status = status;
    return this.complaints.save(complaint);
  }

  private getOtherParticipant(trip: TripEntity, authorId: string, role: UserRole) {
    if (role === UserRole.PASAJERO && trip.passenger_id === authorId) return trip.driver_id;
    if (role === UserRole.CONDUCTOR && trip.driver_id === authorId) return trip.passenger_id;
    return null;
  }

  private async refreshAverage(subjectId: string) {
    const result = await this.reviews
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.subject_id = :subjectId', { subjectId })
      .andWhere('review.status = :status', { status: ReviewStatus.APROBADA })
      .getRawOne<{ average: string | null }>();
    await this.users.update(subjectId, {
      calificacionPromedio: result?.average ? Number(Number(result.average).toFixed(1)) : 0,
    });
  }
}
