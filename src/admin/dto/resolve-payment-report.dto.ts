import { IsIn } from 'class-validator';

export class ResolvePaymentReportDto {
  @IsIn(['paid', 'dismissed'])
  action: 'paid' | 'dismissed';
}
