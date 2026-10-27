import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { CONFIG } from '../config/env';

const poolData = {
  UserPoolId: CONFIG.COGNITO_USER_POOL_ID,
  ClientId: CONFIG.COGNITO_CLIENT_ID
};

const userPool = CONFIG.COGNITO_USER_POOL_ID && CONFIG.COGNITO_CLIENT_ID
  ? new CognitoUserPool(poolData)
  : null;

export const cognitoService = {
  /**
   * Registro de usuario en Cognito User Pool con atributos name, email y custom:dpi
   */
  signUp: async (username, password, email, fullName, dpi) => {
    if (CONFIG.IS_MOCK || !userPool) {
      console.log('[MOCK Cognito] signUp simulado:', { username, email, fullName, dpi });
      return {
        userSub: `mock-sub-${Date.now()}`,
        userConfirmed: false
      };
    }

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: fullName }),
      new CognitoUserAttribute({ Name: 'custom:dpi', Value: dpi })
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(username, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('[Cognito signUp error]:', err);
          return reject(err);
        }
        resolve({
          userSub: result.userSub,
          userConfirmed: result.userConfirmed,
          cognitoUser: result.user
        });
      });
    });
  },

  /**
   * Confirmación de registro con código recibido por correo
   */
  confirmSignUp: async (username, code) => {
    if (CONFIG.IS_MOCK || !userPool) {
      console.log('[MOCK Cognito] confirmSignUp con código:', code);
      return 'SUCCESS';
    }

    const userData = {
      Username: username,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('[Cognito confirmRegistration error]:', err);
          return reject(err);
        }
        resolve(result);
      });
    });
  },

  /**
   * Reenvío del código de verificación
   */
  resendConfirmationCode: async (username) => {
    if (CONFIG.IS_MOCK || !userPool) {
      return 'SUCCESS';
    }

    const userData = {
      Username: username,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  /**
   * Autenticación tradicional en Cognito para obtener el idToken
   */
  signIn: async (username, password) => {
    if (CONFIG.IS_MOCK || !userPool) {
      console.log('[MOCK Cognito] signIn con usuario:', username);
      return {
        idToken: `mock-cognito-idtoken-${Date.now()}`,
        accessToken: `mock-cognito-accesstoken-${Date.now()}`,
        username
      };
    }

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    const userData = {
      Username: username,
      Pool: userPool
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          resolve({
            idToken: session.getIdToken().getJwtToken(),
            accessToken: session.getAccessToken().getJwtToken(),
            username
          });
        },
        onFailure: (err) => {
          console.error('[Cognito authenticateUser error]:', err);
          reject(err);
        }
      });
    });
  }
};
