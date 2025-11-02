import { CreateTransactionDto } from './create-transaction.dto';
import { validateDto } from './test-helpers';

describe('CreateTransactionDto', () => {
  const validDto = {
    productId: 'product-123',
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

  it('should validate correct transaction data', async () => {
    const errors = await validateDto(CreateTransactionDto, validDto);
    expect(errors.length).toBe(0);
  });

  it('should fail with missing productId', async () => {
    const invalidData = { ...validDto, productId: '' };
    const errors = await validateDto(CreateTransactionDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with quantity less than 1', async () => {
    const invalidData = { ...validDto, quantity: 0 };
    const errors = await validateDto(CreateTransactionDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative quantity', async () => {
    const invalidData = { ...validDto, quantity: -1 };
    const errors = await validateDto(CreateTransactionDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });

  describe('Credit Card validation', () => {
    it('should fail with invalid card number length', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, number: '123' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with too long card number', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, number: '12345678901234567890' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept 13-digit card number', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, number: '4242424242424' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should accept 16-digit card number', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, number: '4242424242424242' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should accept 19-digit card number', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, number: '4242424242424242424' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid CVC (too short)', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, cvc: '12' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid CVC (too long)', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, cvc: '12345' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept 3-digit CVC', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, cvc: '123' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should accept 4-digit CVC', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, cvc: '1234' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid expiration month (00)', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, expMonth: '00' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid expiration month (13)', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, expMonth: '13' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid expiration months', async () => {
      const validMonths = ['01', '06', '12'];

      for (const month of validMonths) {
        const validData = {
          ...validDto,
          creditCard: { ...validDto.creditCard, expMonth: month },
        };
        const errors = await validateDto(CreateTransactionDto, validData);
        expect(errors.length).toBe(0);
      }
    });

    it('should fail with invalid expiration year format', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, expYear: '2025' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid 2-digit year', async () => {
      const validData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, expYear: '25' },
      };
      const errors = await validateDto(CreateTransactionDto, validData);
      expect(errors.length).toBe(0);
    });

    it('should fail with empty card holder', async () => {
      const invalidData = {
        ...validDto,
        creditCard: { ...validDto.creditCard, cardHolder: '' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Nested validation', () => {
    it('should fail with invalid nested customer', async () => {
      const invalidData = {
        ...validDto,
        customer: { ...validDto.customer, email: 'invalid-email' },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid nested delivery', async () => {
      const invalidData = {
        ...validDto,
        delivery: {
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
        },
      };
      const errors = await validateDto(CreateTransactionDto, invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
