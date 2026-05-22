// src/constants/enums.js
// All values match the Spring Boot enum serialization (snake_case uppercase).

export const TRANSACTION_TYPES = {
  STRAIGHT_EXPENSE: 'STRAIGHT_EXPENSE',
  INSTALLMENT_EXPENSE: 'INSTALLMENT_EXPENSE',
  GROUP_EXPENSE: 'GROUP_EXPENSE',
};

// Labels for display in the UI.
export const TRANSACTION_TYPE_LABELS = {
  STRAIGHT_EXPENSE: 'Straight Expense',
  INSTALLMENT_EXPENSE: 'Installment Expense',
  GROUP_EXPENSE: 'Group Expense',
};

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID', // matches backend enum name
  PAID: 'PAID',
};

export const INSTALLMENT_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  SKIPPED: 'SKIPPED',
  DELINQUENT: 'DELINQUENT',
};

export const PAYMENT_ALLOCATION_STATUS = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
};

export const PAYMENT_FREQUENCY = {
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
};

export const PAYMENT_FREQUENCY_LABELS = {
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
};