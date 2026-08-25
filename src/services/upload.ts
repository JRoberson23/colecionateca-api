import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';

// Configuração do Cloudinary (com validação)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Verificar se as credenciais estão definidas
if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Credenciais do Cloudinary não configuradas!');
  console.error('Verifique: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('✅ Cloudinary configurado com sucesso!');
}

// Armazenamento em memória (não salva no disco)
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem não suportado. Use JPG, PNG, GIF, WEBP ou SVG.'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Função para fazer upload para o Cloudinary
export const uploadToCloudinary = async (fileBuffer: Buffer, filename: string): Promise<string> => {
  try {
    // Verificar se o Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary não configurado. Verifique as variáveis de ambiente.');
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'colecionateca',
          public_id: filename.replace(/\.[^/.]+$/, ''), // Remove a extensão
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    return (result as any).secure_url;
  } catch (error) {
    console.error('❌ Erro no upload para Cloudinary:', error);
    throw new Error('Erro ao fazer upload da imagem para a nuvem');
  }
};