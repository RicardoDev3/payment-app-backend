import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PRODUCT_REPOSITORY, CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY, DELIVERY_REPOSITORY } from '../../domain/repositories';
import type { ProductRepository, CustomerRepository, TransactionRepository, DeliveryRepository } from '../../domain/repositories';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Delivery } from '../../domain/entities/delivery.entity';
import { CreateTransactionDto } from '../dto';
import { TransactionStatus, PaymentMethod } from '../../shared/types';
import { ProductNotFoundError, InsufficientStockError } from '../../shared/errors/domain.errors';
import { Result } from '../../shared/types/result';

export interface CreateTransactionResult {
  transaction: Transaction;
  customer: Customer;
  delivery: Delivery;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: CreateTransactionDto): Promise<Result<CreateTransactionResult, Error>> {
    try {
      // 1. Verificar que el producto exista
      const product = await this.productRepository.findById(dto.productId);
      if (!product) {
        return Result.failure(new ProductNotFoundError(dto.productId));
      }

      // 2. Verificar que haya stock disponible
      if (!product.hasStock(dto.quantity)) {
        return Result.failure(new InsufficientStockError(dto.productId, product.stock, dto.quantity));
      }

      // 3. Crear o encontrar el cliente
      let customer = await this.customerRepository.findByEmail(dto.customer.email);

      if (!customer) {
        customer = new Customer(uuidv4(), dto.customer.email, dto.customer.fullName, dto.customer.phoneNumber, new Date());
        await this.customerRepository.save(customer);
      }

      // 4. Calcular montos
      const baseFee = this.configService.get<number>('BASE_FEE', 2000);
      const deliveryFee = this.configService.get<number>('DELIVERY_FEE', 5000);
      const productAmount = product.price * dto.quantity;

      const fees = Transaction.calculateFees(productAmount, baseFee, deliveryFee);

      // 5. Crear la transacción en estado PENDING
      const transaction = new Transaction(
        uuidv4(),
        product.id,
        customer.id,
        productAmount,
        fees.baseFee,
        fees.deliveryFee,
        fees.total,
        TransactionStatus.PENDING,
        PaymentMethod.CREDIT_CARD,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      await this.transactionRepository.save(transaction);

      // 6. Crear información de entrega
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 días

      const delivery = new Delivery(uuidv4(), transaction.id, customer.id, dto.delivery.address, dto.delivery.deliveryNotes || '', estimatedDelivery, new Date());

      await this.deliveryRepository.save(delivery);

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
