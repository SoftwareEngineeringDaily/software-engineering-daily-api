import axios from 'axios';
import config from '../../config/config';

export default function sendError({ userName, eventData }) {
  return axios.post(`${config.eventStreamUrl}error`, {
    clientId: userName,
    deviceType: 'API',
    errorTime: new Date().getTime(),
    eventData
  })
    .then(response => response)
    .catch(error => error);
}
