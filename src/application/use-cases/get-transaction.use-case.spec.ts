import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionUseCase } from './get-transaction.use-case';
import { TRANSACTION_REPOSITORY, TransactionRepository, CUSTOMER_REPOSITORY, CustomerRepository, DELIVERY_REPOSITORY, DeliveryRepository } from '../../domain/repositories';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { TransactionStatus, PaymentMethod } from '../../shared/types';
import { TransactionNotFoundError } from '../../shared/errors/domain.errors';

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let deliveryRepository: jest.Mocked<DeliveryRepository>;

  beforeEach(async () => {
    const mockTransactionRepository: jest.Mocked<TransactionRepository> = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockDeliveryRepository: jest.Mocked<DeliveryRepository> = {
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      findByCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: CUSTOMER_REPOSITORY, useValue: mockCustomerRepository },
        { provide: DELIVERY_REPOSITORY, useValue: mockDeliveryRepository },
      ],
    }).compile();

    useCase = module.get<GetTransactionUseCase>(GetTransactionUseCase);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
    deliveryRepository = module.get(DELIVERY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return transaction with customer and delivery', async () => {
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

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      customerRepository.findById.mockResolvedValue(mockCustomer);
      deliveryRepository.findByTransactionId.mockResolvedValue(mockDelivery);

      const result = await useCase.execute('txn-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.transaction).toEqual(mockTransaction);
      expect(result.value.customer).toEqual(mockCustomer);
      expect(result.value.delivery).toEqual(mockDelivery);
    });

    it('should return failure when transaction not found', async () => {
      transactionRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute('non-existent');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TransactionNotFoundError);
    });

    it('should handle missing customer gracefully', async () => {
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
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      customerRepository.findById.mockResolvedValue(null);
      deliveryRepository.findByTransactionId.mockResolvedValue(null);

      const result = await useCase.execute('txn-1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.transaction).toEqual(mockTransaction);
      expect(result.value.customer).toBeNull();
      expect(result.value.delivery).toBeNull();
    });
  });
});
