const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '../uploads');

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`[Upload] Rejected: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Only JPEG, JPG, PNG, and WebP images are allowed'), false);
  }
};

function createStorage(subfolder, prefix) {
  const dest = path.join(UPLOADS_ROOT, subfolder);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    console.log(`[Upload] Created directory: ${dest}`);
  }
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${prefix}-${uniqueSuffix}${ext}`;
      console.log(`[Upload] Saving: ${filename}`);
      cb(null, filename);
    },
  });
}

const productUpload = multer({
  storage: createStorage('products', 'product'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const categoryUpload = multer({
  storage: createStorage('categories', 'category'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('[Upload] Error:', err.message);
        return next(err);
      }
      console.log(`[Upload] Files received: ${req.files?.length || 0}`);
      next();
    });
  };
};

module.exports = productUpload;
module.exports.productUpload = productUpload;
module.exports.categoryUpload = categoryUpload;
module.exports.handleUpload = handleUpload;
