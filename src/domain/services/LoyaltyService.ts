import { LOYALTY_POINTS_PER_CURRENCY, TIER_THRESHOLDS } from '@/lib/constants';
import type { Customer } from '@/types';

export class LoyaltyService {
  /**
   * Calculates points earned based on a purchase total.
   */
  static calculatePoints(total: number): number {
    return Math.floor(total / LOYALTY_POINTS_PER_CURRENCY);
  }

  /**
   * Determines the customer tier based on lifetime points.
   */
  static getTier(lifetimePoints: number): Customer['tier'] {
    if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Calculates the new loyalty state for a customer after a sale.
   */
  static processSale(customer: Customer, saleTotal: number): Partial<Customer> {
    const pointsEarned = this.calculatePoints(saleTotal);
    const newLifetime = customer.lifetimePoints + pointsEarned;
    const newTier = this.getTier(newLifetime);

    return {
      loyaltyPoints: customer.loyaltyPoints + pointsEarned,
      lifetimePoints: newLifetime,
      tier: newTier,
      totalSpent: customer.totalSpent + saleTotal,
      totalPurchases: customer.totalPurchases + 1,
      lastPurchaseDate: new Date().toISOString()
    };
  }

  /**
   * Calculates the reversed loyalty state for a customer after a sale refund.
   */
  static reverseSale(customer: Customer, saleTotal: number): Partial<Customer> {
    const pointsToDeduct = this.calculatePoints(saleTotal);
    const newLifetime = Math.max(0, customer.lifetimePoints - pointsToDeduct);
    const newTier = this.getTier(newLifetime);

    return {
      loyaltyPoints: Math.max(0, customer.loyaltyPoints - pointsToDeduct),
      lifetimePoints: newLifetime,
      tier: newTier,
      totalSpent: Math.max(0, customer.totalSpent - saleTotal),
      totalPurchases: Math.max(0, customer.totalPurchases - 1)
    };
  }
}
