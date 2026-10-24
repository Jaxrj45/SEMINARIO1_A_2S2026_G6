import 'dotenv/config';

// Si falta una variable obligatoria el servidor no arranca, asi el error se ve de una vez
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Falta la variable de entorno ${name} en el .env`);
    process.exit(1);
  }
  return value;
}

const withoutTrailingSlash = (value: string | undefined) => (value || '').replace(/\/+$/, '');

export const env = {
  port: Number(process.env.PORT || 5000),

  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
  },

  jwtSecret: required('JWT_SECRET'),
  jwtHours: Number(process.env.JWT_HOURS || 8),

  // Sin llaves: en la EC2 las credenciales salen del rol Semi-EC2-AppRole
  awsRegion: process.env.AWS_REGION || 'us-east-1',

  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
  },

  uploadApi: withoutTrailingSlash(process.env.UPLOAD_API),
  faceApiKey: process.env.FACE_API_KEY || '',

  s3BucketUrl: withoutTrailingSlash(process.env.S3_BUCKET_URL),
};
