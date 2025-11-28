
import { AVAILABLE_PLANS } from "../constants";
import { PlanId, SubscriptionPlan, UserUsage, UserSubscription } from "../types";

export const billingService = {
  
  getAvailablePlans: (): SubscriptionPlan[] => {
    return AVAILABLE_PLANS;
  },

  getPlanById: (id: PlanId): SubscriptionPlan | undefined => {
    return AVAILABLE_PLANS.find(p => p.id === id);
  },

  /**
   * Checks if a user can create a new invoice based on their plan and current usage.
   */
  canCreateInvoice: (usage: UserUsage, subscription: UserSubscription): boolean => {
    const plan = billingService.getPlanById(subscription.planId);
    if (!plan) return false;

    // If limit is undefined, it's unlimited
    if (plan.limits.maxInvoicesPerMonth === undefined) return true;

    return usage.invoicesCreatedCurrentMonth < plan.limits.maxInvoicesPerMonth;
  },

  /**
   * Checks if a user can create a new client.
   */
  canCreateClient: (usage: UserUsage, subscription: UserSubscription): boolean => {
    const plan = billingService.getPlanById(subscription.planId);
    if (!plan) return false;

    if (plan.limits.maxClients === undefined) return true;

    return usage.clientsCreatedTotal < plan.limits.maxClients;
  },

  /**
   * Checks if a user can create a recurring invoice.
   */
  canCreateRecurringInvoice: (usage: UserUsage, subscription: UserSubscription): boolean => {
    const plan = billingService.getPlanById(subscription.planId);
    if (!plan) return false;

    if (plan.limits.maxRecurringInvoices === undefined) return true;

    return usage.recurringInvoicesCreatedTotal < plan.limits.maxRecurringInvoices;
  },

  /**
   * Checks if the user has access to AI features.
   */
  hasAIAccess: (subscription: UserSubscription): boolean => {
    const plan = billingService.getPlanById(subscription.planId);
    return plan?.limits.aiAssistantIncluded ?? false;
  }
};
