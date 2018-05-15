import config from '../../config/config';

const stripeSecretKey = config.stripe.secretKey;
const stripe = require('stripe')(stripeSecretKey);

export default stripe;
