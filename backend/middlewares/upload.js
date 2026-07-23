const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  // Allow all common extensions as requested (PDF, Image, Word, Excel, PPT, ZIP, Video, Audio, Text)
  const allowedExtensions = [
    // PDF
    '.pdf',
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff',
    // Word Documents
    '.doc', '.docx', '.rtf', '.odt',
    // Excel Spreadsheets
    '.xls', '.xlsx', '.csv', '.ods',
    // PowerPoint
    '.ppt', '.pptx', '.odp',
    // ZIP Archives
    '.zip', '.rar', '.7z', '.tar', '.gz',
    // Video
    '.mp4', '.mkv', '.avi', '.mov', '.webm',
    // Audio
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
    // Text Files
    '.txt', '.log', '.md', '.html', '.css', '.js', '.json', '.xml'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File extension ${ext} is not supported.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max size
  fileFilter: fileFilter,
});

module.exports = upload;
