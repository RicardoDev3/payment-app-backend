import { Address } from '../../shared/types';

export class Delivery {
  constructor(
    public readonly id: string,
    public readonly transactionId: string,
    public readonly customerId: string,
    public address: Address,
    public deliveryNotes: string,
    public estimatedDeliveryDate: Date,
    public createdAt: Date,
  ) {}

  updateAddress(newAddress: Address): void {
    this.address = newAddress;
  }

  updateEstimatedDelivery(newDate: Date): void {
    this.estimatedDeliveryDate = newDate;
  }

  toJSON() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      customerId: this.customerId,
      address: this.address,
      deliveryNotes: this.deliveryNotes,
      estimatedDeliveryDate: this.estimatedDeliveryDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
