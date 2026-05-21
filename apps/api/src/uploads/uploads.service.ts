import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

/** Forma mínima del archivo entregado por FileInterceptor (multer, memoria). */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Directorio físico de las imágenes; servido en /uploads (ver main.ts).
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  /** Valida y guarda una imagen en uploads/; devuelve su URL pública. */
  async save(file?: UploadedImage) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato no permitido — usa JPG, PNG o WebP');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('La imagen supera el máximo de 5 MB');
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    await fs.writeFile(join(UPLOADS_DIR, filename), file.buffer);

    return { url: `/uploads/${filename}`, filename };
  }
}
