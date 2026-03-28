import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Crear directorio de uploads si no existe (fallback local)
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Disk storage (legacy — used by contract document upload route)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const nameWithoutExt = path.basename(file.originalname, ext)
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`)
  }
})

// Memory storage (buffer — for R2/cloud upload)
const memStorage = multer.memoryStorage()

// Filtro de archivos permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: PDF, Word, Excel, imágenes'))
  }
}

// Disk-based upload (legacy for contract document path)
export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
})

// Memory-based upload (for R2/cloud storage)
export const memoryUpload = multer({
  storage: memStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
})

// Middleware para manejar errores de multer
export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 10MB' })
    }
    return res.status(400).json({ error: `Error al subir archivo: ${err.message}` })
  } else if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}
