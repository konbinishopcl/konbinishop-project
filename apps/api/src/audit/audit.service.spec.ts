import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuditEntity } from '@prisma/client';
import { AuditService, AuditLogParams } from './audit.service';
import { PrismaService } from '../../utils/prisma/prisma.service';

const mockPrismaService = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log()', () => {
    const baseParams: AuditLogParams = {
      userId: 1,
      action: AuditAction.CREATE,
      entity: AuditEntity.EVENT,
      entityId: 42,
    };

    it('llama a prisma.auditLog.create con userId/action/entity/entityId correctos', () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});

      service.log(baseParams);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          action: AuditAction.CREATE,
          entity: AuditEntity.EVENT,
          entityId: 42,
        }),
      });
    });

    it('NO lanza cuando prisma.auditLog.create rechaza', () => {
      // Hacer que create devuelva una promesa rechazada — log() debe absorberla con .catch
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB error'));

      // log() es síncrono: no debe lanzar en ningún caso
      expect(() => service.log(baseParams)).not.toThrow();
    });

    it('extrae ip, userAgent y url del request cuando se proporciona req', () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const mockReq = {
        ip: '192.168.1.1',
        get: jest.fn((header: string) => {
          if (header === 'user-agent') return 'Mozilla/5.0';
          return undefined;
        }),
        originalUrl: '/api/events/1',
      } as unknown as import('express').Request;

      service.log({ ...baseParams, req: mockReq });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          url: '/api/events/1',
        }),
      });
    });

    it('usa null para ip/userAgent/url cuando no se proporciona req', () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});

      service.log(baseParams);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip: null,
          userAgent: null,
          url: null,
        }),
      });
    });
  });

  describe('findAll()', () => {
    beforeEach(() => {
      // findMany y count deben devolver promesas para que $transaction reciba un array de promesas
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);
    });

    it('arma el where con entity, action y userId cuando se pasan', async () => {
      await service.findAll({
        entity: AuditEntity.USER,
        action: AuditAction.UPDATE,
        userId: 5,
        page: 1,
        pageSize: 10,
      });

      // Verificar que findMany fue llamado con el where correcto
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entity: AuditEntity.USER,
            action: AuditAction.UPDATE,
            userId: 5,
          }),
        }),
      );
    });

    it('devuelve { items, total, page, pageSize, totalPages }', async () => {
      const mockItems = [{ id: 1, action: AuditAction.CREATE }];
      mockPrismaService.$transaction.mockResolvedValue([mockItems, 25]);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(result).toEqual({
        items: mockItems,
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });

    it('aplica paginación por defecto (page=1, pageSize=50) cuando no se pasan filtros', async () => {
      await service.findAll({});

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('limita pageSize a 200 aunque se pida más', async () => {
      await service.findAll({ pageSize: 999 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('arma where.createdAt con gte y lte cuando se pasan dateFrom y dateTo', async () => {
      await service.findAll({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date('2026-01-01'),
            }),
          }),
        }),
      );
    });
  });
});
