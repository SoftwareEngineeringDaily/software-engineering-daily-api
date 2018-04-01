import axios from 'axios';
import config from '../../config/config';

export default function sendError({ userName, errorData }) {
  return axios.post(`${config.eventStreamUrl}error`, {
    clientId: userName,
    eventApiEnv: 'production',
    deviceType: 'API',
    errorTime: new Date().getTime(),
    errorData
  })
    .then(response => response)
    .catch(error => error);
}
