import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and normalises Nigerian and international phone numbers.
 * Supports Nigerian formats: 080..., 081..., 070..., 090..., 091..., +234..., 234...
 * Also supports valid standard E.164 international phone numbers.
 */
export function normalisePhoneNumber(phone: string): { isValid: boolean; normalised: string; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  
  if (!cleaned) {
    return { isValid: false, normalised: "", error: "Phone number is required." };
  }

  // Nigerian standard local format e.g. 08012345678 (11 digits starting with 0)
  if (/^0[789][01]\d{8}$/.test(cleaned)) {
    const normalised = "+234" + cleaned.slice(1);
    return { isValid: true, normalised };
  }

  // Nigerian format without leading zero but 10 digits e.g. 8012345678
  if (/^[789][01]\d{8}$/.test(cleaned)) {
    const normalised = "+234" + cleaned;
    return { isValid: true, normalised };
  }

  // Nigerian format with country code prefix 2348012345678 (13 digits)
  if (/^234[789][01]\d{8}$/.test(cleaned)) {
    const normalised = "+" + cleaned;
    return { isValid: true, normalised };
  }

  // International E.164 phone format (+ followed by 7-15 digits)
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return { isValid: true, normalised: cleaned };
  }

  return {
    isValid: false,
    normalised: cleaned,
    error: "Please enter a valid phone number (e.g. 08012345678 or +2348012345678).",
  };
}

/**
 * Normalises email address: trimmed and lowercased.
 */
export function normaliseEmail(email: string): { isValid: boolean; normalised: string; error?: string } {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!trimmed) {
    return { isValid: false, normalised: "", error: "Email address is required." };
  }
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, normalised: trimmed, error: "Please provide a valid email address." };
  }

  return { isValid: true, normalised: trimmed };
}
