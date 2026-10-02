import { IsEnum } from 'class-validator';
import { ComplaintStatus } from '../entities/complaint.entity';

export class ModerateComplaintDto {
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus.REVISADA | ComplaintStatus.DESCARTADA;
}
