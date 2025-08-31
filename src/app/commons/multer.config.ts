import multer from 'multer';

type Callback<T> = (error: Error | null, result: T) => void;

export const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: Callback<boolean>,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error('File type not allowed'), false);
    }
    callback(null, true);
  },
};
