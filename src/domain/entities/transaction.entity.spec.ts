import { Transaction } from './transaction.entity';
import { TransactionStatus, PaymentMethod } from '../../shared/types';

describe('Transaction Entity', () => {
  let transaction: Transaction;

  beforeEach(() => {
    transaction = new Transaction(
      'txn-id',
      'product-id',
      'customer-id',
      100000,
      2000,
      5000,
      107000,
      TransactionStatus.PENDING,
      PaymentMethod.CREDIT_CARD,
      null,
      null,
      null,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    );
  });

  describe('calculateFees', () => {
    it('should calculate fees correctly', () => {
      const fees = Transaction.calculateFees(100000, 2000, 5000);
      expect(fees).toEqual({
        baseFee: 2000,
        deliveryFee: 5000,
        total: 107000,
      });
    });

    it('should handle zero product price', () => {
      const fees = Transaction.calculateFees(0, 2000, 5000);
      expect(fees.total).toBe(7000);
    });
  });

  describe('updateStatus', () => {
    it('should update status', () => {
      transaction.updateStatus(TransactionStatus.APPROVED);
      expect(transaction.status).toBe(TransactionStatus.APPROVED);
    });

    it('should update wompiTransactionId if provided', () => {
      transaction.updateStatus(TransactionStatus.APPROVED, 'wompi-123');
      expect(transaction.wompiTransactionId).toBe('wompi-123');
    });

    it('should update paymentResponse if provided', () => {
      const response = { data: 'test' };
      transaction.updateStatus(TransactionStatus.APPROVED, undefined, response);
      expect(transaction.paymentResponse).toEqual(response);
    });

    it('should update updatedAt timestamp', () => {
      const initialDate = transaction.updatedAt;
      setTimeout(() => {
        transaction.updateStatus(TransactionStatus.APPROVED);
        expect(transaction.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      }, 10);
    });
  });

  describe('status checks', () => {
    it('isPending should return true for PENDING status', () => {
      expect(transaction.isPending()).toBe(true);
    });

    it('isApproved should return true for APPROVED status', () => {
      transaction.updateStatus(TransactionStatus.APPROVED);
      expect(transaction.isApproved()).toBe(true);
    });

    it('isDeclined should return true for DECLINED status', () => {
      transaction.updateStatus(TransactionStatus.DECLINED);
      expect(transaction.isDeclined()).toBe(true);
    });
  });

  describe('markAsApproved', () => {
    it('should mark transaction as approved', () => {
      const response = { status: 'approved' };
      transaction.markAsApproved('wompi-123', response);

      expect(transaction.status).toBe(TransactionStatus.APPROVED);
      expect(transaction.wompiTransactionId).toBe('wompi-123');
      expect(transaction.paymentResponse).toEqual(response);
    });
  });

  describe('markAsDeclined', () => {
    it('should mark transaction as declined', () => {
      const response = { status: 'declined', reason: 'insufficient funds' };
      transaction.markAsDeclined(response);

      expect(transaction.status).toBe(TransactionStatus.DECLINED);
      expect(transaction.paymentResponse).toEqual(response);
    });
  });

  describe('markAsError', () => {
    it('should mark transaction as error', () => {
      const errorResponse = { error: 'payment failed' };
      transaction.markAsError(errorResponse);

      expect(transaction.status).toBe(TransactionStatus.ERROR);
      expect(transaction.paymentResponse).toEqual(errorResponse);
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON representation', () => {
      const json = transaction.toJSON();

      expect(json).toHaveProperty('id', 'txn-id');
      expect(json).toHaveProperty('productId', 'product-id');
      expect(json).toHaveProperty('customerId', 'customer-id');
      expect(json).toHaveProperty('productAmount', 100000);
      expect(json).toHaveProperty('baseFee', 2000);
      expect(json).toHaveProperty('deliveryFee', 5000);
      expect(json).toHaveProperty('totalAmount', 107000);
      expect(json).toHaveProperty('status', TransactionStatus.PENDING);
      expect(json).toHaveProperty('paymentMethod', PaymentMethod.CREDIT_CARD);
    });
  });
});
