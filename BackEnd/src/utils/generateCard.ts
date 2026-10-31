import crypto from 'crypto';

export function generate16DigitCardNumber(): string {
  let result = '';
  while (result.length < 16) {
    const byte = crypto.randomBytes(1)[0];
    const digit = byte % 10;
    result += digit.toString();
  }
  return result;
}
