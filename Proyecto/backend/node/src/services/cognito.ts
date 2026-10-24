import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AttributeType,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env';
import { ApiError } from '../utils/http';

// En la compu se puede trabajar sin Cognito: si COGNITO_USER_POOL_ID esta vacio
// se saltan las revisiones contra Cognito. En la EC2 siempre tiene que estar.
export const cognitoEnabled = Boolean(env.cognito.userPoolId && env.cognito.clientId);

if (!cognitoEnabled) {
  console.warn('[cognito] COGNITO_USER_POOL_ID o COGNITO_CLIENT_ID vacio: no se revisa nada contra Cognito');
}

// Sin llaves: en la EC2 usa el rol Semi-EC2-AppRole
const client = new CognitoIdentityProviderClient({ region: env.awsRegion });

let verifier: { verify(token: string): Promise<any> } | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: env.cognito.userPoolId,
      clientId: env.cognito.clientId,
      tokenUse: 'id',
    });
  }
  return verifier;
}

// Valida el idToken que manda el frontend despues de iniciar sesion en Cognito
export async function verifyIdToken(idToken: string): Promise<{ sub: string; username: string }> {
  if (!cognitoEnabled) {
    throw new ApiError(502, 'UPSTREAM_ERROR', 'Cognito no está configurado en el servidor');
  }
  try {
    const payload = await getVerifier().verify(idToken);
    return { sub: payload.sub, username: String(payload['cognito:username'] || '') };
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'La sesión de Cognito no es válida');
  }
}

export interface CognitoUser {
  sub: string;
  status: string; // CONFIRMED, UNCONFIRMED, etc.
}

export async function getCognitoUser(username: string): Promise<CognitoUser | null> {
  try {
    const result = await client.send(
      new AdminGetUserCommand({ UserPoolId: env.cognito.userPoolId, Username: username })
    );
    const sub = result.UserAttributes?.find((a) => a.Name === 'sub')?.Value || '';
    return { sub, status: result.UserStatus || '' };
  } catch (e: any) {
    if (e?.name === 'UserNotFoundException') return null;
    console.error('[cognito] AdminGetUser:', e);
    throw new ApiError(502, 'UPSTREAM_ERROR', 'No se pudo consultar Cognito');
  }
}

// Registro: el usuario tiene que existir en Cognito con ese sub
export async function assertCognitoSignup(username: string, cognitoSub: string) {
  if (!cognitoEnabled) return;
  const user = await getCognitoUser(username);
  if (!user || user.sub !== cognitoSub) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'El usuario no está registrado en Cognito', {
      cognitoSub: 'No coincide con el usuario de Cognito',
    });
  }
}

// Login facial: la cuenta tiene que tener el correo verificado
export async function assertCognitoConfirmed(username: string) {
  if (!cognitoEnabled) return;
  const user = await getCognitoUser(username);
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Usuario o rostro incorrecto');
  }
  if (user.status !== 'CONFIRMED') {
    throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Debes verificar tu correo antes de iniciar sesión');
  }
}

// Editar perfil: nombre y DPI tambien se guardan en Cognito
export async function updateCognitoUser(username: string, changes: { fullName?: string; dpi?: string }) {
  if (!cognitoEnabled) return;

  const attributes: AttributeType[] = [];
  if (changes.fullName !== undefined) attributes.push({ Name: 'name', Value: changes.fullName });
  if (changes.dpi !== undefined) attributes.push({ Name: 'custom:dpi', Value: changes.dpi });
  if (attributes.length === 0) return;

  try {
    await client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: env.cognito.userPoolId,
        Username: username,
        UserAttributes: attributes,
      })
    );
  } catch (e) {
    console.error('[cognito] AdminUpdateUserAttributes:', e);
    throw new ApiError(502, 'UPSTREAM_ERROR', 'No se pudo actualizar el usuario en Cognito');
  }
}
