// Configuración del SDK de AWS (S3 y RDS)
// Responsable: Integrante B, usando las credenciales IAM que entregue Integrante A

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  // Las credenciales se toman del rol IAM de la instancia EC2
  // o de las variables de entorno AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
});

const dbConfig = {
  host: process.env.RDS_HOST,       // lo entrega Integrante C
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
};

module.exports = { s3, dbConfig };
