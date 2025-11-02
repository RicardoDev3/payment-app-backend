/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBProductRepository } from './product.repository.impl';
import { DYNAMODB_CLIENT } from '../../config/dynamodb.config';
import { Product } from '../../../domain/entities/product.entity';

describe('DynamoDBProductRepository', () => {
  let repository: DynamoDBProductRepository;
  let dynamoDBClient: { send: jest.Mock };

  beforeEach(async () => {
    const mockDynamoDBClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamoDBProductRepository, { provide: DYNAMODB_CLIENT, useValue: mockDynamoDBClient as unknown as DynamoDBDocumentClient }],
    }).compile();

    repository = module.get<DynamoDBProductRepository>(DynamoDBProductRepository);
    dynamoDBClient = module.get(DYNAMODB_CLIENT) as unknown as { send: jest.Mock };
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const mockItem = {
        id: 'product-1',
        name: 'Test Product',
        description: 'Description',
        price: 100000,
        stock: 10,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dynamoDBClient.send.mockResolvedValue({ Item: mockItem });

      const result = await repository.findById('product-1');

      expect(result).toBeInstanceOf(Product);
      expect(result?.id).toBe('product-1');
      expect(result?.name).toBe('Test Product');
    });

    it('should return null when product not found', async () => {
      dynamoDBClient.send.mockResolvedValue({});

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockItems = [
        {
          id: 'product-1',
          name: 'Product 1',
          description: 'Description 1',
          price: 100000,
          stock: 10,
          imageUrl: 'https://example.com/1.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      dynamoDBClient.send.mockResolvedValue({ Items: mockItems });

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Product);
    });

    it('should return empty array when no products', async () => {
      dynamoDBClient.send.mockResolvedValue({ Items: [] });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should save product', async () => {
      const product = new Product('product-1', 'Test Product', 'Description', 100000, 10, 'https://example.com/image.jpg', new Date(), new Date());

      dynamoDBClient.send.mockResolvedValue({});

      const result = await repository.save(product);

      expect(result).toBe(product);
      expect(dynamoDBClient.send).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const product = new Product('product-1', 'Updated Product', 'Updated Description', 150000, 5, 'https://example.com/updated.jpg', new Date(), new Date());

      dynamoDBClient.send.mockResolvedValue({
        Attributes: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          createdAt: product.createdAt?.toISOString(),
          updatedAt: product.updatedAt?.toISOString(),
        },
      });

      const result = await repository.update(product);

      expect(result).toBeInstanceOf(Product);
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      dynamoDBClient.send.mockResolvedValue({});

      await repository.delete('product-1');

      expect(dynamoDBClient.send).toHaveBeenCalled();
    });
  });
});
