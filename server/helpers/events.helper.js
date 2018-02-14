import axios from 'axios';
import config from '../../config/config';

export default function sendEvent({ userName, eventType, eventData }) {
  return axios.post(`${config.eventStreamUrl}`, {
    clientId: userName,
    deviceType: 'API',
    eventTime: new Date().getTime(),
    eventType,
    eventData
  })
    .then(response => response)
    .catch(error => error);
}
