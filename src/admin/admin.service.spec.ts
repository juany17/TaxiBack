import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TripPaymentStatus, TripStatus } from '../trips/entities/trip.entity';

describe('AdminService reported payments', () => {
  it('lists only reported payments with passenger and driver details', async () => {
    const tripsRepository = {
      find: jest.fn().mockResolvedValue([{ id: 'trip-1', payment_status: TripPaymentStatus.REPORTADO }]),
    };
    const service = new AdminService(
      {} as never,
      {} as never,
      tripsRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getReportedPayments()).resolves.toHaveLength(1);
    expect(tripsRepository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { payment_status: TripPaymentStatus.REPORTADO },
      relations: { passenger: true, driver: true },
    }));
  });

  it('marks a reported payment paid and records the reviewing admin', async () => {
    const trip = {
      id: 'trip-1',
      status: TripStatus.FINALIZADO,
      payment_status: TripPaymentStatus.REPORTADO,
      payment_issue: 'No veo la transferencia',
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(trip),
      save: jest.fn(async (entity) => entity),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
    };
    const gateway = { notifyTripPaymentChanged: jest.fn() };
    const service = new AdminService({} as never, {} as never, {} as never, {} as never, dataSource as never, gateway as never);

    await expect(service.resolveReportedPayment('trip-1', 'admin-1', 'paid')).resolves.toMatchObject({
      payment_status: TripPaymentStatus.PAGADO,
      payment_reviewed_by: 'admin-1',
      payment_review_action: 'paid',
    });
    expect(gateway.notifyTripPaymentChanged).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-1' }));
    expect(trip.payment_issue).toBe('No veo la transferencia');
  });

  it('dismisses a report and returns its payment to pending without deleting the report reason', async () => {
    const trip = {
      id: 'trip-1',
      status: TripStatus.FINALIZADO,
      payment_status: TripPaymentStatus.REPORTADO,
      payment_issue: 'Reporte equivocado',
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue(trip),
      save: jest.fn(async (entity) => entity),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
    };
    const service = new AdminService(
      {} as never, {} as never, {} as never, {} as never, dataSource as never,
      { notifyTripPaymentChanged: jest.fn() } as never,
    );

    await expect(service.resolveReportedPayment('trip-1', 'admin-1', 'dismissed')).resolves.toMatchObject({
      payment_status: TripPaymentStatus.PENDIENTE,
      payment_issue: 'Reporte equivocado',
      payment_review_action: 'dismissed',
    });
  });

  it('rejects resolving a payment that is not currently reported', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'trip-1',
        payment_status: TripPaymentStatus.PAGADO,
      }),
      save: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
    };
    const service = new AdminService(
      {} as never, {} as never, {} as never, {} as never, dataSource as never,
      { notifyTripPaymentChanged: jest.fn() } as never,
    );

    await expect(service.resolveReportedPayment('trip-1', 'admin-1', 'paid'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a missing trip explicitly', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
    };
    const service = new AdminService(
      {} as never, {} as never, {} as never, {} as never, dataSource as never,
      { notifyTripPaymentChanged: jest.fn() } as never,
    );

    await expect(service.resolveReportedPayment('missing', 'admin-1', 'paid'))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
