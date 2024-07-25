import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../../prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccountEntity } from './account.entity';

describe('AccountService', () => {
  let service: AccountService;

  const mockAccounts: AccountEntity[] = [
    {
      id: '66423c8100665fbdd46e487e',
      number: 123,
      balance: 500.0,
      type: 'Bonus',
      bonusScore: 0,
    },
    {
      id: '66422342342342342',
      number: 1234,
      balance: 500.0,
      type: 'Default',
      bonusScore: 0,
    },
    {
      id: '6642472ef2234234234234',
      number: 12345,
      balance: 500.0,
      type: 'Saving',
    },
    {
      id: '6642472ef2234234234234',
      number: 12345123,
      balance: 1000.0,
      type: 'Saving',
    },
    {
      id: '66423c213123123123',
      number: 123456,
      balance: 500.0,
      type: 'Bonus',
      bonusScore: 0,
    },
  ];

  const mockPrismaService = {
    account: {
      create: jest.fn().mockImplementation(({ data }) => {
        mockAccounts.push(data);
        return data;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where && where.type) {
          return mockAccounts.filter((account) => account.type === where.type);
        }
        return mockAccounts;
      }),
      findUnique: jest.fn().mockResolvedValue(mockAccounts[0]),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const accountIndex = mockAccounts.findIndex(
          (ac) => ac.number === where.number,
        );
        if (accountIndex > -1) {
          mockAccounts[accountIndex] = {
            ...mockAccounts[accountIndex],
            ...data,
          };
          return mockAccounts[accountIndex];
        }
        return null;
      }),
      delete: jest.fn(),
      findFirst: jest
        .fn()
        .mockImplementation(({ where }: { where: { number: number } }) => {
          return mockAccounts.find((ac) => ac.number === where.number);
        }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should throw ConflictException if account number already exists', async () => {
      await expect(service.createAccount(123, 'Default', 1000)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if initial balance is required but not provided', async () => {
      await expect(service.createAccount(123236, 'Default', 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a new Saving account successfully', async () => {
      const newAccount: AccountEntity = {
        number: 1236757,
        type: 'Saving',
        balance: 1000,
      };
      const result = await service.createAccount(1236757, 'Saving', 1000);
      expect(result).toEqual(newAccount);
    });

    it('should create a new Default account successfully', async () => {
      const newAccount: AccountEntity = {
        number: 123000,
        type: 'Default',
        balance: 1000,
      };
      const result = await service.createAccount(123000, 'Default', 1000);
      expect(result).toEqual(newAccount);
    });

    it('should create a new Bonus account successfully', async () => {
      const newAccount: AccountEntity = {
        number: 1230390,
        type: 'Bonus',
        balance: 1000,
        bonusScore: 10,
      };
      const result = await service.createAccount(1230390, 'Bonus', 1000);
      expect(result).toEqual(newAccount);
    });
  });

  describe('getAccountByNumber', () => {
    it('should throw NotFoundException if account does not exist', async () => {
      await expect(service.getAccountByNumber(12354654654)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the account if it exists', async () => {
      const result = await service.getAccountByNumber(123);
      expect(result).toEqual(mockAccounts[0]);
    });
  });

  describe('debitFromAccount', () => {
    it('should throw BadRequestException if balance is insufficient', async () => {
      await expect(service.debitFromAccount(123, 1501)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should debit amount from account successfully', async () => {
      const result = await service.debitFromAccount(123, 100);
      expect(result.balance).toBe(400);
    });
  });

  describe('creditToAccount', () => {
    it('should credit amount to Default account successfully', async () => {
      const result = await service.creditToAccount(1234, 500);
      expect(result.balance).toBe(1000);
    });

    it('should credit amount to Bonus account and add bonus points successfully', async () => {
      const result = await service.creditToAccount(123, 500);
      expect(result.balance).toBe(900);
      expect(result.bonusScore).toBe(5);
    });
  });

  describe('transferAmount', () => {
    it('should throw BadRequestException if balance is insufficient', async () => {
      await expect(service.transferAmount(123, 1234, 2500)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should transfer amount between accounts successfully', async () => {
      const result = await service.transferAmount(123, 1234, 500);
      expect(result.fromAccount.balance).toBe(400);
      expect(result.toAccount.balance).toBe(1500);
    });

    it('should transfer amount and add bonus points to Bonus account successfully', async () => {
      const result = await service.transferAmount(1234, 123456, 500);
      expect(result.fromAccount.balance).toBe(1000);
      expect(result.toAccount.balance).toBe(1000);
      expect(result.toAccount.bonusScore).toBe(3);
    });
  });

  describe('yieldInterestByAccount', () => {
    it('should yield interest for account successfully', async () => {
      const result = await service.yieldInterestByAccount(12345, 5);
      expect(result.balance).toBe(525);
    });
  });

  describe('yieldInterest', () => {
    it('should yield interest for all saving accounts successfully', async () => {
      const result = await service.yieldInterest(5);
      expect(result[0].balance).toBe(551.25);
      expect(result[1].balance).toBe(1050);
    });
  });
});
