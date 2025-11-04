/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: string;
    token: string;
  };
  reference: string;
  customer_data?: {
    phone_number: string;
    full_name: string;
  };
}

export interface WompiTokenizeCardRequest {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface WompiTokenizeCardResponse {
  data: {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    created_at: string;
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: string;
    payment_method: any;
    status: string;
    status_message: string;
    customer_email: string;
    customer_data: any;
  };
}

@Injectable()
export class WompiClient {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('WOMPI_BASE_URL') ?? '';
    this.publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY') ?? '';
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY') ?? '';
    this.integrityKey = this.configService.get<string>('WOMPI_INTEGRITY_KEY') ?? '';
  }

  /**
   * Tokeniza una tarjeta de crédito
   * Convierte los datos sensibles de la tarjeta en un token seguro
   */
  async tokenizeCard(cardData: any): Promise<WompiTokenizeCardResponse> {
    try {
      // ✅ Normalizar datos - soportar ambos formatos (camelCase y snake_case)
      const normalizedData: WompiTokenizeCardRequest = {
        number: (cardData.number || '').replace(/\s/g, ''),
        cvc: String(cardData.cvc),
        exp_month: String(cardData.exp_month || cardData.expMonth),
        exp_year: String(cardData.exp_year || cardData.expYear),
        card_holder: String(cardData.card_holder || cardData.cardHolder).toUpperCase(),
      };

      // ✅ Log para debug
      console.log('Tokenizing card with normalized data:', {
        number: `****${normalizedData.number.slice(-4)}`,
        exp_month: normalizedData.exp_month,
        exp_year: normalizedData.exp_year,
        card_holder: normalizedData.card_holder,
      });

      const response = await firstValueFrom(
        this.httpService.post<WompiTokenizeCardResponse>(`${this.baseUrl}/tokens/cards`, normalizedData, {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log('Card tokenized successfully:', response.data.data.id);
      return response.data;
    } catch (error) {
      console.error('Error tokenizing card:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Failed to tokenize card: ${error.response?.data?.error?.reason || error.message}`);
    }
  }

  /**
   * Procesa un pago con Wompi
   */
  async createTransaction(paymentData: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    try {
      if (!paymentData.customer_email || !paymentData.customer_email.includes('@')) {
        throw new Error(`Invalid customer email: ${paymentData.customer_email}`);
      }

      const signature = this.generateIntegritySignature(paymentData.reference, paymentData.amount_in_cents, paymentData.currency);

      const acceptanceToken = await this.getAcceptanceToken();

      const payload = {
        acceptance_token: acceptanceToken,
        amount_in_cents: paymentData.amount_in_cents,
        currency: paymentData.currency,
        customer_email: paymentData.customer_email,
        payment_method: {
          type: 'CARD',
          token: paymentData.payment_method.token,
          installments: 1,
        },
        reference: paymentData.reference,
        signature: signature,
        ...(paymentData.customer_data && { customer_data: paymentData.customer_data }),
      };

      console.log('Creating Wompi transaction with payload:', {
        ...payload,
        signature: { integrity: signature.substring(0, 20) + '...' },
      });

      const response = await firstValueFrom(
        this.httpService.post<WompiPaymentResponse>(`${this.baseUrl}/transactions`, payload, {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      console.log('✅ Wompi transaction created:', {
        id: response.data.data.id,
        status: response.data.data.status,
        amount: response.data.data.amount_in_cents,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', {
        status: error.response?.status,
        error: error.response?.data?.error,
        messages: error.response?.data?.error?.messages,
      });

      throw new Error(`Failed to create transaction: ${JSON.stringify(error.response?.data?.error || error.message)}`);
    }
  }

  /**
   * Obtiene el acceptance_token de Wompi
   * Este token es necesario para confirmar que el usuario acepta los términos
   */
  private async getAcceptanceToken(): Promise<string> {
    try {
      // Endpoint para obtener el merchant y su acceptance_token
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/merchants/${this.publicKey}`, {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        }),
      );

      const acceptanceToken = response.data.data.presigned_acceptance.acceptance_token;
      console.log('Acceptance token obtained:', acceptanceToken?.substring(0, 30) + '...');

      return acceptanceToken;
    } catch (error) {
      console.error('Error getting acceptance token:', error.response?.data);
      throw new Error('Failed to get acceptance token from Wompi');
    }
  }

  /**
   * Consulta el estado de una transacción
   */
  async getTransaction(transactionId: string): Promise<WompiPaymentResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<WompiPaymentResponse>(`${this.baseUrl}/transactions/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error getting transaction:', error.response?.data || error.message);
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Genera la firma de integridad requerida por Wompi
   * Esta firma asegura que la transacción no ha sido modificada
   */
  private generateIntegritySignature(reference: string, amountInCents: number, currency: string): string {
    // ✅ FORMATO CORRECTO: reference + amountInCents + currency + integrityKey
    const concatenatedString = `${reference}${amountInCents}${currency}${this.integrityKey}`;

    console.log('Generating signature with:', {
      reference,
      amountInCents,
      currency,
      integrityKey: this.integrityKey?.substring(0, 20) + '...',
      concatenatedString: concatenatedString.substring(0, 50) + '...',
    });

    const signature = crypto.createHash('sha256').update(concatenatedString).digest('hex');

    console.log('Generated signature:', signature);

    return signature;
  }

  /**
   * Valida el tipo de tarjeta basándose en el número
   */
  detectCardType(cardNumber: string): 'VISA' | 'MASTERCARD' | 'UNKNOWN' {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // VISA empieza con 4
    if (/^4/.test(cleanNumber)) {
      return 'VISA';
    }

    // MASTERCARD empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2(2[2-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleanNumber)) {
      return 'MASTERCARD';
    }

    return 'UNKNOWN';
  }
}
