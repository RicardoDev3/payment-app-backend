import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBCustomerRepository } from './customer.repository.impl';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { Customer } from '../../../domain/entities/customer.entity';

describe('DynamoDBCustomerRepository', () => {
  let repository: DynamoDBCustomerRepository;
  let dynamoDBClient: any; // ← Cambiar el tipo a 'any'

  beforeEach(async () => {
    const mockDynamoDBClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamoDBCustomerRepository, { provide: DYNAMODB_CLIENT, useValue: mockDynamoDBClient }],
    }).compile();

    repository = module.get<DynamoDBCustomerRepository>(DynamoDBCustomerRepository);
    dynamoDBClient = module.get(DYNAMODB_CLIENT);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      const mockItem = {
        id: 'customer-1',
        email: 'test@example.com',
        fullName: 'John Doe',
        phoneNumber: '+573001234567',
        createdAt: new Date().toISOString(),
      };

      (dynamoDBClient.send as jest.Mock).mockResolvedValue({ Item: mockItem });

      const result = await repository.findById('customer-1');

      expect(result).toBeInstanceOf(Customer);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      (dynamoDBClient.send as jest.Mock).mockResolvedValue({});

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return customer when found by email', async () => {
      const mockItem = {
        id: 'customer-1',
        email: 'test@example.com',
        fullName: 'John Doe',
        phoneNumber: '+573001234567',
        createdAt: new Date().toISOString(),
      };

      (dynamoDBClient.send as jest.Mock).mockResolvedValue({ Items: [mockItem] });

      const result = await repository.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(Customer);
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      (dynamoDBClient.send as jest.Mock).mockResolvedValue({ Items: [] });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save customer', async () => {
      const customer = new Customer('customer-1', 'test@example.com', 'John Doe', '+573001234567', new Date());

      (dynamoDBClient.send as jest.Mock).mockResolvedValue({});

      const result = await repository.save(customer);

      expect(result).toBe(customer);
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      const customer = new Customer('customer-1', 'updated@example.com', 'John Updated', '+573009999999', new Date());

      (dynamoDBClient.send as jest.Mock).mockResolvedValue({
        Attributes: {
          id: customer.id,
          email: customer.email,
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
          createdAt: customer.createdAt.toISOString(),
        },
      });

      const result = await repository.update(customer);

      expect(result).toBeInstanceOf(Customer);
    });
  });
});
