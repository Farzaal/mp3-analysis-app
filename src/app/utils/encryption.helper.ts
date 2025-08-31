import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionHelper {
  constructor(private configService: ConfigService) {}

  encrypt(plaintext: string) {
    const ciphertext = CryptoJS.AES.encrypt(
      plaintext,
      this.configService.get('FRONTEND_CRYPTO_SECRET_KEY'),
    ).toString();
    return ciphertext;
  }

  decrypt(ciphertext: string) {
    const bytes = CryptoJS.AES.decrypt(
      ciphertext,
      this.configService.get('FRONTEND_CRYPTO_SECRET_KEY'),
    );
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData;
  }

  decryptWpPayload(encryptedMessage: string) {
    const iv = this.configService
      .get('FRONTEND_CRYPTO_SECRET_KEY')
      .substr(0, 16);
    const secret = this.configService
      .get('FRONTEND_CRYPTO_SECRET_KEY')
      .substring(0, 32);
    const key = CryptoJS.enc.Utf8.parse(secret);
    const ivParsed = CryptoJS.enc.Utf8.parse(iv);
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key, {
      iv: ivParsed,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
