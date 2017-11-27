import stripe from '../helpers/stripe';
import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import Subscription from '../models/subscription.model';

function create(req, res, next) {
  const { stripeToken } = req.body;
  const { user } = req;
  const stripeEmail = user.email;

  stripe.customers.create({
    email: stripeEmail,
    card: stripeToken
  })
  .then(customer => {
        // TODO: save customer in DB
        return stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              plan: "standard_subscription",
            },
          ],
        })
        .then((subscription) => {
          return {subscription, customer}
        })
  })
  .catch(err => {
    console.log("Error:", err);
    next(err);
  })
  .then(({subscription, customer}) => {
    console.log('subscription', subscription);
    const newSubscription = new Subscription();
    newSubscription.stripe.subscriptionId = subscription.id;
    newSubscription.stripe.customerId = customer.id;
    newSubscription.stripe.email = stripeEmail;
    newSubscription.active = true;
    newSubscription.user = user._id;
    newSubscription.save();
    res.json({'succes': 'sucess'})
  });
}

export default { create };
