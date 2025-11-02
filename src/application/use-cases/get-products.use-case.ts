import { Injectable, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/repositories';
import type { ProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities/product.entity';
import { Result } from '../../shared/types/result';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<Result<Product[], Error>> {
    try {
      const products = await this.productRepository.findAll();
      return Result.success(products);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
