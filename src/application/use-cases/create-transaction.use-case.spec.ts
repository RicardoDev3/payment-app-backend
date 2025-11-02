/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
  CUSTOMER_REPOSITORY,
  CustomerRepository,
  TRANSACTION_REPOSITORY,
  TransactionRepository,
  DELIVERY_REPOSITORY,
  DeliveryRepository,
} from '../../domain/repositories';
import { Product } from '../../domain/entities/product.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { CreateTransactionDto } from '../dto';
import { ProductNotFoundError, InsufficientStockError } from '../../shared/errors/domain.errors';
import { TransactionStatus } from '../../shared/types';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let productRepository: jest.Mocked<ProductRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let deliveryRepository: jest.Mocked<DeliveryRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockTransactionRepository: jest.Mocked<TransactionRepository> = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
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

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'BASE_FEE') return 2000;
        if (key === 'DELIVERY_FEE') return 5000;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransactionUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: CUSTOMER_REPOSITORY, useValue: mockCustomerRepository },
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: DELIVERY_REPOSITORY, useValue: mockDeliveryRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<CreateTransactionUseCase>(CreateTransactionUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
    customerRepository = module.get(CUSTOMER_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    deliveryRepository = module.get(DELIVERY_REPOSITORY);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
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

    it('should create transaction successfully with existing customer', async () => {
      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      const mockCustomer = new Customer('customer-1', 'test@example.com', 'John Doe', '+573001234567', new Date());

      productRepository.findById.mockResolvedValue(mockProduct);
      customerRepository.findByEmail.mockResolvedValue(mockCustomer);
      transactionRepository.save.mockImplementation(async (txn) => txn);
      deliveryRepository.save.mockImplementation(async (del) => del);

      const result = await useCase.execute(validDto);

      expect(result.isSuccess).toBe(true);
      expect(result.value.transaction.status).toBe(TransactionStatus.PENDING);
      expect(result.value.transaction.productAmount).toBe(100000);
      expect(result.value.transaction.baseFee).toBe(2000);
      expect(result.value.transaction.deliveryFee).toBe(5000);
      expect(result.value.transaction.totalAmount).toBe(107000);
      expect(result.value.customer).toEqual(mockCustomer);
      expect(customerRepository.save).not.toHaveBeenCalled();
    });

    it('should create transaction and new customer when customer does not exist', async () => {
      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      productRepository.findById.mockResolvedValue(mockProduct);
      customerRepository.findByEmail.mockResolvedValue(null);
      customerRepository.save.mockImplementation(async (customer) => customer);
      transactionRepository.save.mockImplementation(async (txn) => txn);
      deliveryRepository.save.mockImplementation(async (del) => del);

      const result = await useCase.execute(validDto);

      expect(result.isSuccess).toBe(true);
      expect(customerRepository.save).toHaveBeenCalledTimes(1);
      expect(result.value.customer.email).toBe('test@example.com');
    });

    it('should return failure when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validDto);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
    });

    it('should return failure when insufficient stock', async () => {
      const mockProduct = new Product(
        'product-1',
        'Test Product',
        'Description',
        100000,
        0, // Sin stock
        'https://example.com/test.jpg',
        new Date(),
        new Date(),
      );

      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await useCase.execute(validDto);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InsufficientStockError);
    });

    it('should return failure when repository throws error', async () => {
      const error = new Error('Database error');
      productRepository.findById.mockRejectedValue(error);

      const result = await useCase.execute(validDto);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
