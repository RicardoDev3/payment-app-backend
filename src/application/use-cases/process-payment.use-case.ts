import { Injectable, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY } from '../../domain/repositories';
import type { ProductRepository, TransactionRepository } from '../../domain/repositories';
import { TransactionStatus } from '../../shared/types';
import { TransactionNotFoundError, PaymentProcessingError } from '../../shared/errors/domain.errors';
import { Result } from '../../shared/types/result';
import { WompiClient } from '../../infrastructure/external/wompi/wompi.client';
import { Transaction } from '../../domain/entities/transaction.entity';

export interface ProcessPaymentInput {
  transactionId: string;
  creditCard: {
    number: string;
    cvc: string;
    expMonth: string;
    expYear: string;
    cardHolder: string;
  };
}

export interface ProcessPaymentResult {
  transaction: Transaction;
  wompiTransactionId: string;
  status: TransactionStatus;
  message: string;
}

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly wompiClient: WompiClient,
  ) {}

  async execute(input: ProcessPaymentInput): Promise<Result<ProcessPaymentResult, Error>> {
    try {
      // 1. Buscar la transacción
      const transaction = await this.transactionRepository.findById(input.transactionId);

      if (!transaction) {
        return Result.failure(new TransactionNotFoundError(input.transactionId));
      }

      // 2. Verificar que la transacción esté en estado PENDING
      if (!transaction.isPending()) {
        return Result.failure(new PaymentProcessingError(`Transaction is not in PENDING status. Current status: ${transaction.status}`));
      }

      // 3. Buscar el producto para obtener el email del cliente
      const product = await this.productRepository.findById(transaction.productId);

      if (!product) {
        return Result.failure(new PaymentProcessingError('Product not found for transaction'));
      }

      // 4. Tokenizar la tarjeta de crédito con Wompi
      let cardToken: string;
      try {
        const tokenResponse = await this.wompiClient.tokenizeCard({
          number: input.creditCard.number,
          cvc: input.creditCard.cvc,
          exp_month: input.creditCard.expMonth,
          exp_year: input.creditCard.expYear,
          card_holder: input.creditCard.cardHolder,
        });

        cardToken = tokenResponse.data.id;
      } catch (error) {
        // Si falla la tokenización, marcar transacción como ERROR
        transaction.markAsError({
          error: 'Card tokenization failed',
          details: error.message,
        });
        await this.transactionRepository.update(transaction);

        return Result.failure(new PaymentProcessingError(`Card tokenization failed: ${error.message}`));
      }

      // 5. Generar referencia única para la transacción
      const reference = `TXN-${transaction.id}-${Date.now()}`;

      // 6. Procesar el pago con Wompi
      try {
        const paymentResponse = await this.wompiClient.createTransaction({
          amount_in_cents: transaction.totalAmount,
          currency: 'COP',
          customer_email: input.creditCard.cardHolder, // Usamos el nombre del titular
          payment_method: {
            type: 'CARD',
            token: cardToken,
          },
          reference: reference,
        });

        const wompiStatus = paymentResponse.data.status;
        const wompiTransactionId = paymentResponse.data.id;

        // 7. Actualizar transacción según el resultado de Wompi
        if (wompiStatus === 'APPROVED') {
          // Pago aprobado
          transaction.markAsApproved(wompiTransactionId, paymentResponse.data);
          await this.transactionRepository.update(transaction);

          // 8. Reducir el stock del producto
          product.reduceStock(1); // Asumimos cantidad = 1 por ahora
          await this.productRepository.update(product);

          return Result.success({
            transaction,
            wompiTransactionId,
            status: TransactionStatus.APPROVED,
            message: 'Payment processed successfully',
          });
        } else if (wompiStatus === 'DECLINED') {
          // Pago rechazado
          transaction.markAsDeclined(paymentResponse.data);
          await this.transactionRepository.update(transaction);

          return Result.failure(new PaymentProcessingError(`Payment declined: ${paymentResponse.data.status_message || 'Unknown reason'}`));
        } else {
          // Otro estado (PENDING, ERROR, etc.)
          transaction.markAsError(paymentResponse.data);
          await this.transactionRepository.update(transaction);

          return Result.failure(new PaymentProcessingError(`Payment failed with status: ${wompiStatus}`));
        }
      } catch (error) {
        // Error al procesar el pago
        transaction.markAsError({
          error: 'Payment processing failed',
          details: error.message,
        });
        await this.transactionRepository.update(transaction);

        return Result.failure(new PaymentProcessingError(`Payment failed: ${error.message}`));
      }
    } catch (error) {
      return Result.failure(error);
    }
  }
}
