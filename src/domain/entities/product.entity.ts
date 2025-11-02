export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public stock: number,
    public imageUrl: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  hasStock(quantity: number = 1): boolean {
    return this.stock >= quantity;
  }

  reduceStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
    }
    this.stock -= quantity;
    this.updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    this.stock += quantity;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
