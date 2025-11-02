import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateTransactionUseCase, ProcessPaymentUseCase, GetTransactionUseCase } from '../../application/use-cases';
import { CreateTransactionDto } from '../../application/dto';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createTransaction(@Body() dto: CreateTransactionDto) {
    const result = await this.createTransactionUseCase.execute(dto);

    if (result.isFailure) {
      const error = result.error;

      // Determinar el código de estado HTTP apropiado
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      if (error.message.includes('not found')) {
        statusCode = HttpStatus.NOT_FOUND;
      } else if (error.message.includes('Insufficient stock')) {
        statusCode = HttpStatus.BAD_REQUEST;
      }

      throw new HttpException(
        {
          message: 'Failed to create transaction',
          error: error.message,
        },
        statusCode,
      );
    }

    const { transaction, customer, delivery } = result.value;

    return {
      success: true,
      data: {
        transaction: transaction.toJSON(),
        customer: customer.toJSON(),
        delivery: delivery.toJSON(),
      },
    };
  }

  @Post(':id/process-payment')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async processPayment(@Param('id') transactionId: string, @Body() body: { creditCard: any }) {
    const result = await this.processPaymentUseCase.execute({
      transactionId,
      creditCard: body.creditCard,
    });

    if (result.isFailure) {
      throw new HttpException(
        {
          message: 'Payment processing failed',
          error: result.error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      data: {
        transaction: result.value.transaction.toJSON(),
        wompiTransactionId: result.value.wompiTransactionId,
        status: result.value.status,
        message: result.value.message,
      },
    };
  }

  @Get(':id')
  async getTransaction(@Param('id') id: string) {
    const result = await this.getTransactionUseCase.execute(id);

    if (result.isFailure) {
      throw new HttpException(
        {
          message: 'Transaction not found',
          error: result.error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const { transaction, customer, delivery } = result.value;

    return {
      success: true,
      data: {
        transaction: transaction.toJSON(),
        customer: customer?.toJSON(),
        delivery: delivery?.toJSON(),
      },
    };
  }
}
