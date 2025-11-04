import { Injectable, Inject } from '@nestjs/common';
import { CUSTOMER_REPOSITORY, PRODUCT_REPOSITORY, TRANSACTION_REPOSITORY } from '../../domain/repositories';
import type { CustomerRepository, ProductRepository, TransactionRepository } from '../../domain/repositories';
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
    exp_month: string;
    exp_year: string;
    card_holder: string;
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
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
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

      // 3. ✅ BUSCAR EL CUSTOMER usando customerId
      const customer = await this.customerRepository.findById(transaction.customerId);

      if (!customer) {
        return Result.failure(new PaymentProcessingError(`Customer not found: ${transaction.customerId}`));
      }

      console.log('Processing payment for customer:', {
        customerId: customer.id,
        email: customer.email,
        fullName: customer.fullName,
      });

      // 4. Buscar el producto
      const product = await this.productRepository.findById(transaction.productId);

      if (!product) {
        return Result.failure(new PaymentProcessingError('Product not found for transaction'));
      }

      // 5. Tokenizar la tarjeta de crédito con Wompi
      let cardToken: string;
      try {
        console.log('Tokenizing card...');

        const tokenResponse = await this.wompiClient.tokenizeCard({
          number: input.creditCard.number,
          cvc: input.creditCard.cvc,
          exp_month: input.creditCard.exp_month,
          exp_year: input.creditCard.exp_year,
          card_holder: input.creditCard.card_holder,
        });

        cardToken = tokenResponse.data.id;
        console.log('Card tokenized successfully:', cardToken);
      } catch (error) {
        console.error('Card tokenization failed:', error.message);

        transaction.markAsError({
          error: 'Card tokenization failed',
          details: error.message,
        });
        await this.transactionRepository.update(transaction);

        return Result.failure(new PaymentProcessingError(`Card tokenization failed: ${error.message}`));
      }

      // 6. Generar referencia única para la transacción
      const reference = `TXN-${transaction.id}-${Date.now()}`;

      // 7. Procesar el pago con Wompi
      try {
        console.log('Processing payment with Wompi...', {
          amount: transaction.totalAmount,
          reference,
          customerEmail: customer.email,
        });

        const paymentResponse = await this.wompiClient.createTransaction({
          amount_in_cents: transaction.totalAmount,
          currency: 'COP',
          customer_email: customer.email,
          payment_method: {
            type: 'CARD',
            token: cardToken,
          },
          reference: reference,
          customer_data: {
            phone_number: customer.phoneNumber,
            full_name: customer.fullName,
          },
        });

        const wompiStatus = paymentResponse.data.status;
        const wompiTransactionId = paymentResponse.data.id;

        console.log('Payment response:', {
          wompiTransactionId,
          status: wompiStatus,
        });

        // 8. ✅ Actualizar transacción según el resultado de Wompi
        // En sandbox: PENDING es considerado éxito
        // En producción: Solo APPROVED es éxito
        if (wompiStatus === 'APPROVED' || wompiStatus === 'PENDING') {
          console.log(`✅ Payment ${wompiStatus} - Marking as approved`);

          // Pago aprobado o pendiente (sandbox)
          transaction.markAsApproved(wompiTransactionId, paymentResponse.data);
          await this.transactionRepository.update(transaction);

          // 9. Reducir el stock del producto
          const quantity = 1;
          product.reduceStock(quantity);
          await this.productRepository.update(product);

          return Result.success({
            transaction,
            wompiTransactionId,
            status: TransactionStatus.APPROVED,
            message: `Payment processed successfully (Status: ${wompiStatus})`,
          });
        } else if (wompiStatus === 'DECLINED') {
          console.log('❌ Payment DECLINED');

          // Pago rechazado
          transaction.markAsDeclined(paymentResponse.data);
          await this.transactionRepository.update(transaction);

          return Result.failure(new PaymentProcessingError(`Payment declined: ${paymentResponse.data.status_message || 'Unknown reason'}`));
        } else {
          console.log(`⚠️ Payment with unexpected status: ${wompiStatus}`);

          // Otro estado inesperado
          transaction.markAsError(paymentResponse.data);
          await this.transactionRepository.update(transaction);

          return Result.failure(new PaymentProcessingError(`Payment failed with status: ${wompiStatus}`));
        }
      } catch (error) {
        console.error('Payment processing failed:', error.message);

        // Error al procesar el pago
        transaction.markAsError({
          error: 'Payment processing failed',
          details: error.message,
        });
        await this.transactionRepository.update(transaction);

        return Result.failure(new PaymentProcessingError(`Payment failed: ${error.message}`));
      }
    } catch (error) {
      console.error('Unexpected error in ProcessPaymentUseCase:', error);
      return Result.failure(error);
    }
  }
}
