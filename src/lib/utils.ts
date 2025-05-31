import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Format for Ivory Coast phone numbers (+225 XX XX XX XX XX)
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check if it's already in the correct format
  if (digits.length === 10) {
    return `+225 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  
  // If it includes the country code
  if (digits.length === 13 && digits.startsWith('225')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)} ${digits.slice(11, 13)}`;
  }
  
  return phoneNumber;
}

export function generatePolicyNumber(): string {
  const prefix = 'G3A';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export function getContractStatus(endDate: string): 'active' | 'expired' {
  const today = new Date();
  const end = parseISO(endDate);
  return today <= end ? 'active' : 'expired';
}

export function calculateDaysRemaining(endDate: string): number {
  const today = new Date();
  const end = parseISO(endDate);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}