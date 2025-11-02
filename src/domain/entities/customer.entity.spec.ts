import { Customer } from './customer.entity';

describe('Customer Entity', () => {
  let customer: Customer;

  beforeEach(() => {
    customer = new Customer('customer-id', 'test@example.com', 'John Doe', '+573001234567', new Date('2024-01-01'));
  });

  describe('constructor', () => {
    it('should create a customer with all properties', () => {
      expect(customer.id).toBe('customer-id');
      expect(customer.email).toBe('test@example.com');
      expect(customer.fullName).toBe('John Doe');
      expect(customer.phoneNumber).toBe('+573001234567');
      expect(customer.createdAt).toEqual(new Date('2024-01-01'));
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON representation', () => {
      const json = customer.toJSON();

      expect(json).toHaveProperty('id', 'customer-id');
      expect(json).toHaveProperty('email', 'test@example.com');
      expect(json).toHaveProperty('fullName', 'John Doe');
      expect(json).toHaveProperty('phoneNumber', '+573001234567');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
