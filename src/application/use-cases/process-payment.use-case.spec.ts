/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from './process-payment.use-case';
import { TRANSACTION_REPOSITORY, TransactionRepository, PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories';
import { WompiClient } from '../../infrastructure/external/wompi/wompi.client';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Product } from '../../domain/entities/product.entity';
import { TransactionStatus, PaymentMethod } from '../../shared/types';
import { TransactionNotFoundError, PaymentProcessingError } from '../../shared/errors/domain.errors';

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let wompiClient: jest.Mocked<WompiClient>;

  beforeEach(async () => {
    const mockTransactionRepository: jest.Mocked<TransactionRepository> = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockWompiClient = {
      tokenizeCard: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      detectCardType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: WompiClient, useValue: mockWompiClient },
      ],
    }).compile();

    useCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
    wompiClient = module.get(WompiClient);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const validInput = {
      transactionId: 'txn-1',
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
        TransactionStatus.PENDING,
        PaymentMethod.CREDIT_CARD,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      const mockTokenResponse = {
        data: {
          id: 'tok_test_123',
          created_at: '2024-01-01',
          brand: 'VISA',
          name: 'VISA-4242',
          last_four: '4242',
          bin: '424242',
          exp_year: '25',
          exp_month: '12',
          card_holder: 'John Doe',
          expires_at: '2025-12-31',
        },
      };

      const mockPaymentResponse = {
        data: {
          id: 'wompi-txn-123',
          created_at: '2024-01-01',
          amount_in_cents: 107000,
          reference: 'TXN-txn-1-123456789',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {},
          status: 'APPROVED',
          status_message: 'Approved',
          customer_email: 'test@example.com',
          customer_data: {},
        },
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(mockProduct);
      wompiClient.tokenizeCard.mockResolvedValue(mockTokenResponse);
      wompiClient.createTransaction.mockResolvedValue(mockPaymentResponse);
      transactionRepository.update.mockImplementation(async (txn) => txn);
      productRepository.update.mockImplementation(async (prod) => prod);

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(TransactionStatus.APPROVED);
      expect(result.value.wompiTransactionId).toBe('wompi-txn-123');
      expect(wompiClient.tokenizeCard).toHaveBeenCalledWith({
        number: validInput.creditCard.number,
        cvc: validInput.creditCard.cvc,
        exp_month: validInput.creditCard.expMonth,
        exp_year: validInput.creditCard.expYear,
        card_holder: validInput.creditCard.cardHolder,
      });
      expect(productRepository.update).toHaveBeenCalled();
    });

    it('should return failure when transaction not found', async () => {
      transactionRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TransactionNotFoundError);
    });

    it('should return failure when transaction is not PENDING', async () => {
      const mockTransaction = new Transaction(
        'txn-1',
        'product-1',
        'customer-1',
        100000,
        2000,
        5000,
        107000,
        TransactionStatus.APPROVED, // Ya está aprobada
        PaymentMethod.CREDIT_CARD,
        'wompi-123',
        null,
        null,
        new Date(),
        new Date(),
      );

      transactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('not in PENDING status');
    });

    it('should handle card tokenization failure', async () => {
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

      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(mockProduct);
      wompiClient.tokenizeCard.mockRejectedValue(new Error('Invalid card'));
      transactionRepository.update.mockImplementation(async (txn) => txn);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('Card tokenization failed');
      expect(transactionRepository.update).toHaveBeenCalled();
    });

    it('should handle declined payment', async () => {
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

      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      const mockTokenResponse = {
        data: {
          id: 'tok_test_123',
          created_at: '2024-01-01',
          brand: 'VISA',
          name: 'VISA-4242',
          last_four: '4242',
          bin: '424242',
          exp_year: '25',
          exp_month: '12',
          card_holder: 'John Doe',
          expires_at: '2025-12-31',
        },
      };

      const mockPaymentResponse = {
        data: {
          id: 'wompi-txn-123',
          created_at: '2024-01-01',
          amount_in_cents: 107000,
          reference: 'TXN-txn-1-123456789',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {},
          status: 'DECLINED',
          status_message: 'Insufficient funds',
          customer_email: 'test@example.com',
          customer_data: {},
        },
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(mockProduct);
      wompiClient.tokenizeCard.mockResolvedValue(mockTokenResponse);
      wompiClient.createTransaction.mockResolvedValue(mockPaymentResponse);
      transactionRepository.update.mockImplementation(async (txn) => txn);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('Payment declined');
    });

    it('should handle payment error status', async () => {
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

      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      const mockTokenResponse = {
        data: {
          id: 'tok_test_123',
          created_at: '2024-01-01',
          brand: 'VISA',
          name: 'VISA-4242',
          last_four: '4242',
          bin: '424242',
          exp_year: '25',
          exp_month: '12',
          card_holder: 'John Doe',
          expires_at: '2025-12-31',
        },
      };

      const mockPaymentResponse = {
        data: {
          id: 'wompi-txn-123',
          created_at: '2024-01-01',
          amount_in_cents: 107000,
          reference: 'TXN-txn-1-123456789',
          currency: 'COP',
          payment_method_type: 'CARD',
          payment_method: {},
          status: 'ERROR',
          status_message: 'Gateway error',
          customer_email: 'test@example.com',
          customer_data: {},
        },
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(mockProduct);
      wompiClient.tokenizeCard.mockResolvedValue(mockTokenResponse);
      wompiClient.createTransaction.mockResolvedValue(mockPaymentResponse);
      transactionRepository.update.mockImplementation(async (txn) => txn);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('Payment failed with status');
    });

    it('should handle payment processing exception', async () => {
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

      const mockProduct = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      const mockTokenResponse = {
        data: {
          id: 'tok_test_123',
          created_at: '2024-01-01',
          brand: 'VISA',
          name: 'VISA-4242',
          last_four: '4242',
          bin: '424242',
          exp_year: '25',
          exp_month: '12',
          card_holder: 'John Doe',
          expires_at: '2025-12-31',
        },
      };

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(mockProduct);
      wompiClient.tokenizeCard.mockResolvedValue(mockTokenResponse);
      wompiClient.createTransaction.mockRejectedValue(new Error('Network error'));
      transactionRepository.update.mockImplementation(async (txn) => txn);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('Payment failed');
    });

    it('should return failure when product not found', async () => {
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

      transactionRepository.findById.mockResolvedValue(mockTransaction);
      productRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(PaymentProcessingError);
      expect(result.error.message).toContain('Product not found');
    });
  });
});
