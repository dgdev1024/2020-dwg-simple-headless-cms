/**
 * @file lib/crypto.js
 * Functions for encrypting and decrypting strings.
 */

// Imports
const crypto = require("crypto");

/**
 * @function encryptText
 * @brief Encrypts the given text, using the given encryption key.
 *
 * This function encrypts text with an AES-256 encryption algorithm, using a
 * 256-bit (32-byte) encryption key. The key should be kept secret, preferably
 * in your environment variables (.env) file.
 *
 * @param {String} text The text to encrypt
 * @param {String} key The key to encrypt the text with
 * @return {String} The encrypted text.
 */
const encryptText = (text, key) => {
  const initVector = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    initVector
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${initVector.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * @function decryptText
 * @brief Decrypts the given encrypted text, using the given encryption key.
 *
 * This function attempts to use an AES-256 encryption algorithm to decrypt
 * text, using the 32-byte encryption key used to encrypt that text. The key
 * in question MUST match the key that was used to encrypt the text, or the
 * decryption will not work. The encryption key should be kept secret,
 * preferably in your environment variables (.env) file.
 *
 * @param {String} text The encrypted text.
 * @param {String} key The key which was used to encrypt the text.
 */
const decryptText = (text, key) => {
  const parts = text.split(":");
  const initVector = Buffer.from(parts.shift(), "hex");
  const encrypted = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    initVector
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

module.exports = {
  encryptText,
  decryptText,
};
