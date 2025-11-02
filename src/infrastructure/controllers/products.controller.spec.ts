/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { GetProductsUseCase, GetProductByIdUseCase } from '../../application/use-cases';
import { Product } from '../../domain/entities/product.entity';
import { Result } from '../../shared/types/result';
import { ProductNotFoundError } from '../../shared/errors/domain.errors';

describe('ProductsController', () => {
  let controller: ProductsController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

  beforeEach(async () => {
    const mockGetProductsUseCase = {
      execute: jest.fn(),
    };

    const mockGetProductByIdUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: GetProductsUseCase, useValue: mockGetProductsUseCase },
        { provide: GetProductByIdUseCase, useValue: mockGetProductByIdUseCase },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    getProductsUseCase = module.get(GetProductsUseCase);
    getProductByIdUseCase = module.get(GetProductByIdUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return all products successfully', async () => {
      const mockProducts = [
        new Product('1', 'Product 1', 'Description 1', 100000, 10, 'https://example.com/1.jpg', new Date(), new Date()),
        new Product('2', 'Product 2', 'Description 2', 200000, 5, 'https://example.com/2.jpg', new Date(), new Date()),
      ];

      getProductsUseCase.execute.mockResolvedValue(Result.success(mockProducts));

      const response = await controller.getProducts();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toHaveProperty('id');
      expect(response.data[0]).toHaveProperty('name');
    });

    it('should throw HttpException when use case fails', async () => {
      const error = new Error('Database error');
      getProductsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.getProducts()).rejects.toThrow(HttpException);
      await expect(controller.getProducts()).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });

  describe('getProductById', () => {
    it('should return product when it exists', async () => {
      const mockProduct = new Product('test-id', 'Test Product', 'Test Description', 100000, 10, 'https://example.com/test.jpg', new Date(), new Date());

      getProductByIdUseCase.execute.mockResolvedValue(Result.success(mockProduct));

      const response = await controller.getProductById('test-id');

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id', 'test-id');
      expect(response.data).toHaveProperty('name', 'Test Product');
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('test-id');
    });

    it('should throw HttpException with NOT_FOUND when product does not exist', async () => {
      const error = new ProductNotFoundError('non-existent-id');
      getProductByIdUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(controller.getProductById('non-existent-id')).rejects.toThrow(HttpException);
      await expect(controller.getProductById('non-existent-id')).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.NOT_FOUND,
        }),
      );
    });
  });
});
