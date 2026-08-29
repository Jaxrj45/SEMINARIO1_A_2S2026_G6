const crypto = require('crypto');
const AWS = require('aws-sdk');

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

function allowedFile(filename) {
  if (!filename || !filename.includes('.')) return false;
  return ALLOWED_EXTENSIONS.has(filename.split('.').pop().toLowerCase());
}

async function uploadToS3(buffer, key, contentType) {
  await s3
    .upload({
      Bucket: process.env.S3_BUCKET_IMAGES,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();
  return key;
}

async function uploadProfilePhoto(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const folder = process.env.S3_FOLDER_PROFILE || 'Fotos_Perfil';
  const key = `${folder}/${crypto.randomUUID().replace(/-/g, '')}.${ext}`;
  return uploadToS3(file.buffer, key, file.mimetype);
}

function publicUrl(key) {
  if (!key) return null;
  const bucket = process.env.S3_BUCKET_IMAGES;
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

module.exports = { s3, allowedFile, uploadToS3, uploadProfilePhoto, publicUrl };
