import { IsEnum } from 'class-validator';
import { ReviewStatus } from '../entities/review.entity';

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus.APROBADA | ReviewStatus.RECHAZADA;
}
