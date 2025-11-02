import { Delivery } from '../entities/delivery.entity';

export interface DeliveryRepository {
  findById(id: string): Promise<Delivery | null>;
  findByTransactionId(transactionId: string): Promise<Delivery | null>;
  findByCustomerId(customerId: string): Promise<Delivery[]>;
  save(delivery: Delivery): Promise<Delivery>;
  update(delivery: Delivery): Promise<Delivery>;
}

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');
