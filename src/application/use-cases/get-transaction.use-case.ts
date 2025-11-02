import { Injectable, Inject } from '@nestjs/common';
import { TRANSACTION_REPOSITORY, CUSTOMER_REPOSITORY, DELIVERY_REPOSITORY } from '../../domain/repositories';
import type { TransactionRepository, CustomerRepository, DeliveryRepository } from '../../domain/repositories';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { Result } from '../../shared/types/result';
import { TransactionNotFoundError } from '../../shared/errors/domain.errors';

export interface TransactionDetails {
  transaction: Transaction;
  customer: Customer | null;
  delivery: Delivery | null;
}

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async execute(transactionId: string): Promise<Result<TransactionDetails, Error>> {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);

      if (!transaction) {
        return Result.failure(new TransactionNotFoundError(transactionId));
      }

      // Obtener información relacionada
      const customer = await this.customerRepository.findById(transaction.customerId);
      const delivery = await this.deliveryRepository.findByTransactionId(transaction.id);

      return Result.success({
        transaction,
        customer,
        delivery,
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
