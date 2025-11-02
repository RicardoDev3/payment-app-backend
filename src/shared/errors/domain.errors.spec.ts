import { DomainError, ProductNotFoundError, InsufficientStockError, TransactionNotFoundError, PaymentProcessingError, InvalidCreditCardError } from './domain.errors';

describe('Domain Errors', () => {
  describe('DomainError', () => {
    it('should create a domain error with message', () => {
      const error = new DomainError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DomainError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProductNotFoundError', () => {
    it('should create error with product id', () => {
      const error = new ProductNotFoundError('product-123');
      expect(error.message).toContain('product-123');
      expect(error.message).toContain('not found');
      expect(error.name).toBe('ProductNotFoundError');
    });
  });

  describe('InsufficientStockError', () => {
    it('should create error with stock details', () => {
      const error = new InsufficientStockError('product-123', 5, 10);
      expect(error.message).toContain('product-123');
      expect(error.message).toContain('5');
      expect(error.message).toContain('10');
      expect(error.message).toContain('Insufficient stock');
      expect(error.name).toBe('InsufficientStockError');
    });
  });

  describe('TransactionNotFoundError', () => {
    it('should create error with transaction id', () => {
      const error = new TransactionNotFoundError('txn-123');
      expect(error.message).toContain('txn-123');
      expect(error.message).toContain('not found');
      expect(error.name).toBe('TransactionNotFoundError');
    });
  });

  describe('PaymentProcessingError', () => {
    it('should create error with custom message', () => {
      const error = new PaymentProcessingError('Payment declined');
      expect(error.message).toContain('Payment declined');
      expect(error.message).toContain('Payment processing failed');
      expect(error.name).toBe('PaymentProcessingError');
    });
  });

  describe('InvalidCreditCardError', () => {
    it('should create error with validation message', () => {
      const error = new InvalidCreditCardError('Invalid card number');
      expect(error.message).toContain('Invalid card number');
      expect(error.message).toContain('Invalid credit card');
      expect(error.name).toBe('InvalidCreditCardError');
    });
  });
});
