/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';
import { PRODUCT_REPOSITORY, ProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../shared/errors/domain.errors';

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdUseCase,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductByIdUseCase>(GetProductByIdUseCase);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return product when it exists', async () => {
      const mockProduct = new Product('test-id', 'Test Product', 'Test Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await useCase.execute('test-id');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockProduct);
      expect(productRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should return failure when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute('non-existent-id');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ProductNotFoundError);
      expect(result.error.message).toContain('non-existent-id');
    });

    it('should return failure when repository throws error', async () => {
      const error = new Error('Database error');
      productRepository.findById.mockRejectedValue(error);

      const result = await useCase.execute('test-id');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });
});
