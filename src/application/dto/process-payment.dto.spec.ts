import { ProcessPaymentDto } from './process-payment.dto';
import { validateDto } from './test-helpers';

describe('ProcessPaymentDto', () => {
  it('should validate correct data', async () => {
    const validData = {
      transactionId: 'txn-123',
    };

    const errors = await validateDto(ProcessPaymentDto, validData);
    expect(errors.length).toBe(0);
  });

  it('should fail with empty transactionId', async () => {
    const invalidData = {
      transactionId: '',
    };

    const errors = await validateDto(ProcessPaymentDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('transactionId');
  });

  it('should fail with missing transactionId', async () => {
    const invalidData = {};

    const errors = await validateDto(ProcessPaymentDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });
});
