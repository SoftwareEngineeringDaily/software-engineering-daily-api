import axios from 'axios';
import config from '../../config/config';

function sendError({ userName, errorData, errorType }) {
  return axios.post(`${config.eventStreamUrl}error`, {
    clientId: userName,
    eventApiEnv: 'production',
    deviceType: 'API',
    errorType,
    errorTime: new Date().getTime(),
    errorData
  })
    .then(response => response)
    .catch(error => error);
}

const ErrorType = {
  AUTH: 'auth',
  OTHER: 'other'
};

export default {
  sendError,
  ErrorType
};
