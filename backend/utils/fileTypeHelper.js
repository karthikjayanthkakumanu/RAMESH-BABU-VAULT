const path = require('path');

const getFileType = (mimeType, originalFilename) => {
  const ext = path.extname(originalFilename).toLowerCase();

  // 1. PDF
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return 'pdf';
  }

  // 2. Images
  if (
    mimeType.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'].includes(ext)
  ) {
    return 'image';
  }

  // 3. Spreadsheets
  if (
    [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ].includes(mimeType) ||
    ['.xls', '.xlsx', '.csv', '.ods'].includes(ext)
  ) {
    return 'spreadsheet';
  }

  // 4. Presentations
  if (
    [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ].includes(mimeType) ||
    ['.ppt', '.pptx', '.odp'].includes(ext)
  ) {
    return 'presentation';
  }

  // 5. Documents (Word, etc)
  if (
    [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'application/rtf',
    ].includes(mimeType) ||
    ['.doc', '.docx', '.rtf', '.pages'].includes(ext)
  ) {
    return 'document';
  }

  // 6. Archives
  if (
    [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/x-gzip',
    ].includes(mimeType) ||
    ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'].includes(ext)
  ) {
    return 'archive';
  }

  // 7. Video
  if (
    mimeType.startsWith('video/') ||
    ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv'].includes(ext)
  ) {
    return 'video';
  }

  // 8. Audio
  if (
    mimeType.startsWith('audio/') ||
    ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'].includes(ext)
  ) {
    return 'audio';
  }

  // 9. Text
  if (
    mimeType.startsWith('text/') ||
    ['.txt', '.log', '.md', '.html', '.css', '.js', '.json', '.xml'].includes(ext)
  ) {
    return 'text';
  }

  return 'other';
};

module.exports = { getFileType };
