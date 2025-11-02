import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { CreateTransactionUseCase, ProcessPaymentUseCase, GetTransactionUseCase } from '../../application/use-cases';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { Result } from '../../shared/types/result';
import { TransactionStatus, PaymentMethod } from '../../shared/types';
import { CreateTransactionDto } from '../../application/dto';
import { ProductNotFoundError, InsufficientStockError, TransactionNotFoundError } from '../../shared/errors/domain.errors';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let createTransactionUseCase: jest.Mocked<CreateTransactionUseCase>;
  let processPaymentUseCase: jest.Mocked<ProcessPaymentUseCase>;
  let getTransactionUseCase: jest.Mocked<GetTransactionUseCase>;

  beforeEach(async () => {
    const mockCreateTransactionUseCase = { execute: jest.fn() };
    const mockProcessPaymentUseCase = { execute: jest.fn() };
    const mockGetTransactionUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: mockCreateTransactionUseCase },
        { provide: ProcessPaymentUseCase, useValue: mockProcessPaymentUseCase },
        { provide: GetTransactionUseCase, useValue: mockGetTransactionUseCase },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    createTransactionUseCase = module.get(CreateTransactionUseCase);
    processPaymentUseCase = module.get(ProcessPaymentUseCase);
    getTransactionUseCase = module.get(GetTransactionUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTransaction', () => {
    const validDto: CreateTransactionDto = {
      productId: 'product-1',
      quantity: 1,
      customer: {
        email: 'test@example.com',
        fullName: 'John Doe',
        phoneNumber: '+573001234567',
      },
      creditCard: {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '25',
        cardHolder: 'John Doe',
      },
      delivery: {
        address: {
          street: 'Calle 123',
          city: 'Medellín',
          state: 'Antioquia',
          zipCode: '050001',
          country: 'Colombia',
        },
        deliveryNotes: 'Leave at door',
      },
    };

    it('should create transaction successfully', async () => {
      const mockTransaction = new Transaction(
        'txn-1',
        'product-1',
        'customer-1',
        100000,
        2000,
        5000,
        107000,
        TransactionStatus.PENDING,
        PaymentMethod.CREDIT_CARD,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      const mockCustomer = new Customer('customer-1', 'test@example.com', 'John Doe', '+573001234567', new Date());

      const mockDelivery = new Delivery('delivery-1', 'txn-1', 'customer-1', validDto.delivery.address, 'Leave at door', new Date(), new Date());

      createTransactionUseCase.execute.mockResolvedValue(
        Result.success({
          transaction: mockTransaction,
          customer: mockCustomer,
          delivery: mockDelivery,
        }),
      );

      const response = await controller.createTransaction(validDto);

      expect(response.success).toBe(true);
      expect(response.data.transaction).toHaveProperty('id', 'txn-1');
      expect(response.data.customer).toHaveProperty('email', 'test@example.com');
      expect(response.data.delivery).toHaveProperty('id', 'delivery-1');
    });

    it('should throw NOT_FOUND when product does not exist', async () => {
      const error = new ProductNotFoundError('product-1');
      createTransactionUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.createTransaction(validDto)).rejects.toThrow(HttpException);
      await expect(controller.createTransaction(validDto)).rejects.toThrow(expect.objectContaining({ status: HttpStatus.NOT_FOUND }));
    });

    it('should throw BAD_REQUEST when insufficient stock', async () => {
      const error = new InsufficientStockError('product-1', 0, 1);
      createTransactionUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.createTransaction(validDto)).rejects.toThrow(HttpException);
      await expect(controller.createTransaction(validDto)).rejects.toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
    });
  });

  describe('processPayment', () => {
    const creditCardData = {
      creditCard: {
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '25',
        cardHolder: 'John Doe',
      },
    };

    it('should process payment successfully', async () => {
      const mockTransaction = new Transaction(
        'txn-1',
        'product-1',
        'customer-1',
        100000,
        2000,
        5000,
        107000,
        TransactionStatus.APPROVED,
        PaymentMethod.CREDIT_CARD,
        'wompi-123',
        null,
        { status: 'APPROVED' },
        new Date(),
        new Date(),
      );

      processPaymentUseCase.execute.mockResolvedValue(
        Result.success({
          transaction: mockTransaction,
          wompiTransactionId: 'wompi-123',
          status: TransactionStatus.APPROVED,
          message: 'Payment processed successfully',
        }),
      );

      const response = await controller.processPayment('txn-1', creditCardData);

      expect(response.success).toBe(true);
      expect(response.data.status).toBe(TransactionStatus.APPROVED);
      expect(response.data.wompiTransactionId).toBe('wompi-123');
    });

    it('should throw BAD_REQUEST when payment fails', async () => {
      const error = new Error('Payment declined');
      processPaymentUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.processPayment('txn-1', creditCardData)).rejects.toThrow(HttpException);
      await expect(controller.processPayment('txn-1', creditCardData)).rejects.toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
    });
  });

  describe('getTransaction', () => {
    it('should return transaction details successfully', async () => {
      const mockTransaction = new Transaction(
        'txn-1',
        'product-1',
        'customer-1',
        100000,
        2000,
        5000,
        107000,
        TransactionStatus.APPROVED,
        PaymentMethod.CREDIT_CARD,
        'wompi-123',
        null,
        null,
        new Date(),
        new Date(),
      );

      const mockCustomer = new Customer('customer-1', 'test@example.com', 'John Doe', '+573001234567', new Date());

      const mockDelivery = new Delivery(
        'delivery-1',
        'txn-1',
        'customer-1',
        {
          street: 'Calle 123',
          city: 'Medellín',
          state: 'Antioquia',
          zipCode: '050001',
          country: 'Colombia',
        },
        'Leave at door',
        new Date(),
        new Date(),
      );

      getTransactionUseCase.execute.mockResolvedValue(
        Result.success({
          transaction: mockTransaction,
          customer: mockCustomer,
          delivery: mockDelivery,
        }),
      );

      const response = await controller.getTransaction('txn-1');

      expect(response.success).toBe(true);
      expect(response.data.transaction).toHaveProperty('id', 'txn-1');
      expect(response.data.customer).toHaveProperty('email', 'test@example.com');
      expect(response.data.delivery).toHaveProperty('id', 'delivery-1');
    });

    it('should throw NOT_FOUND when transaction does not exist', async () => {
      const error = new TransactionNotFoundError('txn-1');
      getTransactionUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.getTransaction('txn-1')).rejects.toThrow(HttpException);
      await expect(controller.getTransaction('txn-1')).rejects.toThrow(expect.objectContaining({ status: HttpStatus.NOT_FOUND }));
    });
  });
});
