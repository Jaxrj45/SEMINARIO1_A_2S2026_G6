// Subida de imagenes a S3 (bucket Practica1-Images-G#) via SDK oficial de AWS
const AWS = require('aws-sdk');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_IMAGES;

async function uploadToS3(buffer, key, contentType) {
  await s3
    .upload({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();
  return key;
}

function publicUrl(key) {
  if (!key) return null;
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = { uploadToS3, publicUrl };
