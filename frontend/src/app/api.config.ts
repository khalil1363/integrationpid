/** Base URL of the API Gateway (gateway runs on 8080). */
export const GATEWAY_URL = 'http://localhost:8080';

/** Users microservice via gateway. */
export const USER_API_URL = `${GATEWAY_URL}/user`;

/** Evaluation microservice via gateway. */
export const EVALUATION_API_URL = `${GATEWAY_URL}/evaluation`;

/** Public uploads served by evaluation service via gateway. */
export const UPLOADS_URL = `${GATEWAY_URL}/uploads`;
