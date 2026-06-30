import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { put } from '@vercel/blob';

/** Forma mínima del archivo entregado por FileInterceptor (multer, memoria). */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  /** Valida y sube una imagen a Vercel Blob; devuelve su URL pública absoluta. */
  async save(file?: UploadedImage) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato no permitido — usa JPG, PNG o WebP');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('La imagen supera el máximo de 5 MB');
    }

    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    const blob = await put(`uploads/${filename}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // url absoluta (https://...blob.vercel-storage.com/...); el frontend la usa tal cual
    // gracias a imageUrl() del website, que deja pasar rutas que empiezan con "http".
    return { url: blob.url, filename };
  }
}
