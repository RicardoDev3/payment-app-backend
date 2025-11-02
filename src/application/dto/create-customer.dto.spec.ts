import { CreateCustomerDto } from './create-customer.dto';
import { validateDto } from './test-helpers';

describe('CreateCustomerDto', () => {
  it('should validate correct customer data', async () => {
    const validData = {
      email: 'test@example.com',
      fullName: 'John Doe',
      phoneNumber: '+573001234567',
    };

    const errors = await validateDto(CreateCustomerDto, validData);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid email', async () => {
    const invalidData = {
      email: 'invalid-email',
      fullName: 'John Doe',
      phoneNumber: '+573001234567',
    };

    const errors = await validateDto(CreateCustomerDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail with empty email', async () => {
    const invalidData = {
      email: '',
      fullName: 'John Doe',
      phoneNumber: '+573001234567',
    };

    const errors = await validateDto(CreateCustomerDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail with empty fullName', async () => {
    const invalidData = {
      email: 'test@example.com',
      fullName: '',
      phoneNumber: '+573001234567',
    };

    const errors = await validateDto(CreateCustomerDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('fullName');
  });

  it('should fail with invalid phone number', async () => {
    const invalidData = {
      email: 'test@example.com',
      fullName: 'John Doe',
      phoneNumber: 'invalid',
    };

    const errors = await validateDto(CreateCustomerDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phoneNumber');
  });

  it('should accept valid international phone numbers', async () => {
    const validNumbers = ['+573001234567', '+12025551234', '+447911123456'];

    for (const phoneNumber of validNumbers) {
      const data = {
        email: 'test@example.com',
        fullName: 'John Doe',
        phoneNumber,
      };
      const errors = await validateDto(CreateCustomerDto, data);
      expect(errors.length).toBe(0);
    }
  });
});
