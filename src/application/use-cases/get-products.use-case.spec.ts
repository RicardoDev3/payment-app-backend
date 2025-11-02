/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from './get-products.use-case';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities/product.entity';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    // Mock del repositorio
    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all products successfully', async () => {
      const mockProducts = [
        new Product('1', 'Product 1', 'Description 1', 100000, 10, 'https://example.com/1.jpg', new Date(), new Date()),
        new Product('2', 'Product 2', 'Description 2', 200000, 5, 'https://example.com/2.jpg', new Date(), new Date()),
      ];

      productRepository.findAll.mockResolvedValue(mockProducts);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockProducts);
      expect(result.value).toHaveLength(2);
      expect(productRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      productRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
      expect(result.value).toHaveLength(0);
    });

    it('should return failure when repository throws error', async () => {
      const error = new Error('Database connection failed');
      productRepository.findAll.mockRejectedValue(error);

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
