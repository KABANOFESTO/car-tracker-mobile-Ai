const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';

function generateTemporaryPassword(length = 14) {
  const bytes = crypto.randomBytes(length);
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return value;
}

module.exports = { generateTemporaryPassword };
