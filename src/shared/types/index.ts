export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  UNKNOWN = 'UNKNOWN',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreditCardInfo {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}
