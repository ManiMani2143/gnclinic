import { Customer } from '../types';

export const generatePatientId = (existingCustomers: Customer[]): string => {
  let highestNumber = 0;

  existingCustomers.forEach(customer => {
    const number = parseInt(customer.patientId, 10);
    if (number > highestNumber) {
      highestNumber = number;
    }
  });

  const nextNumber = highestNumber + 1;
  return nextNumber.toString().padStart(2, '0'); // e.g., "01", "02", "03"
};

export const validatePatientId = (patientId: string): boolean => {
  // Only 2+ digit numbers (with leading zeros allowed)
  const pattern = /^\d+$/;
  return pattern.test(patientId);
};
