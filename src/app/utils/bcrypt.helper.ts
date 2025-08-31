import * as bcrypt from 'bcrypt';

export async function hashPassword(plainText: string): Promise<any> {
  return new Promise(function (resolve, reject) {
    bcrypt.hash(plainText, 10, function (error: unknown, hash: string) {
      if (error) {
        reject(error);
      } else {
        resolve(hash);
      }
    });
  });
}

export async function comparePassword(
  plainText: string,
  hash: string,
): Promise<any> {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(plainText, hash, function (error: unknown, result: boolean) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
