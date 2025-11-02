import { Injectable, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/repositories';
import type { ProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities/product.entity';
import { Result } from '../../shared/types/result';
import { ProductNotFoundError } from '../../shared/errors/domain.errors';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string): Promise<Result<Product, Error>> {
    try {
      const product = await this.productRepository.findById(productId);

      if (!product) {
        return Result.failure(new ProductNotFoundError(productId));
      }

      return Result.success(product);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
