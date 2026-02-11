import { z } from 'zod';

export const emailSchema = z.string().email('Geçerli bir email adresi girin');

export const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
  .regex(/[a-z]/, 'En az bir küçük harf içermeli')
  .regex(/[0-9]/, 'En az bir rakam içermeli');

export const phoneSchema = z
  .string()
  .regex(/^(\+90|0)?[0-9]{10}$/, 'Geçerli bir telefon numarası girin')
  .optional();

export const urlSchema = z.string().url('Geçerli bir URL girin').optional();

// Validation functions
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}
