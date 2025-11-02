import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { GetProductsUseCase, GetProductByIdUseCase } from '../../application/use-cases';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  async getProducts() {
    const result = await this.getProductsUseCase.execute();

    if (result.isFailure) {
      throw new HttpException(
        {
          message: 'Failed to get products',
          error: result.error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      success: true,
      data: result.value.map((product) => product.toJSON()),
    };
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const result = await this.getProductByIdUseCase.execute(id);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: 'Product not found',
          error: result.error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      data: result.value.toJSON(),
    };
  }
}
