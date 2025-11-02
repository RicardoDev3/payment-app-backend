export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product with id ${productId} not found`);
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, available: number, requested: number) {
    super(`Insufficient stock for product ${productId}. Available: ${available}, Requested: ${requested}`);
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction with id ${transactionId} not found`);
  }
}

export class PaymentProcessingError extends DomainError {
  constructor(message: string) {
    super(`Payment processing failed: ${message}`);
  }
}

export class InvalidCreditCardError extends DomainError {
  constructor(message: string) {
    super(`Invalid credit card: ${message}`);
  }
}
