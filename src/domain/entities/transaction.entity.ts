import { TransactionStatus, PaymentMethod } from '../../shared/types';

export interface TransactionFees {
  baseFee: number;
  deliveryFee: number;
  total: number;
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly customerId: string,
    public productAmount: number,
    public baseFee: number,
    public deliveryFee: number,
    public totalAmount: number,
    public status: TransactionStatus,
    public paymentMethod: PaymentMethod,
    public wompiTransactionId: string | null,
    public wompiReference: string | null,
    public paymentResponse: any,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
    this.productAmount = Number(productAmount);
    this.baseFee = Number(baseFee);
    this.deliveryFee = Number(deliveryFee);
    this.totalAmount = Number(totalAmount);
  }

  static calculateFees(productAmount: number, baseFee: number, deliveryFee: number): { baseFee: number; deliveryFee: number; total: number } {
    const productAmountNum = Number(productAmount);
    const baseFeeNum = Number(baseFee);
    const deliveryFeeNum = Number(deliveryFee);

    const totalInPesos = productAmountNum + baseFeeNum + deliveryFeeNum;

    const totalInCents = Math.round(totalInPesos * 100);

    console.log('Transaction.calculateFees:', {
      productAmount: productAmountNum,
      baseFee: baseFeeNum,
      deliveryFee: deliveryFeeNum,
      totalInPesos,
      totalInCents,
    });

    return {
      baseFee: baseFeeNum,
      deliveryFee: deliveryFeeNum,
      total: totalInCents,
    };
  }

  updateStatus(newStatus: TransactionStatus, wompiTransactionId?: string, paymentResponse?: any): void {
    this.status = newStatus;
    this.updatedAt = new Date();

    if (wompiTransactionId) {
      this.wompiTransactionId = wompiTransactionId;
    }

    if (paymentResponse) {
      this.paymentResponse = paymentResponse;
    }
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === TransactionStatus.APPROVED;
  }

  isDeclined(): boolean {
    return this.status === TransactionStatus.DECLINED;
  }

  markAsApproved(wompiTransactionId: string, paymentResponse: any): void {
    this.updateStatus(TransactionStatus.APPROVED, wompiTransactionId, paymentResponse);
  }

  markAsDeclined(paymentResponse: any): void {
    this.updateStatus(TransactionStatus.DECLINED, undefined, paymentResponse);
  }

  markAsError(errorResponse: any): void {
    this.updateStatus(TransactionStatus.ERROR, undefined, errorResponse);
  }

  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      customerId: this.customerId,
      productAmount: this.productAmount,
      baseFee: this.baseFee,
      deliveryFee: this.deliveryFee,
      totalAmount: this.totalAmount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      wompiTransactionId: this.wompiTransactionId,
      wompiReference: this.wompiReference,
      paymentResponse: this.paymentResponse,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
