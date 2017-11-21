import stripe from '../helpers/stripe';
import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import Subscription from '../models/subscription.model';

function create(req, res, next) {
  const { stripeToken, stripeEmail } = req.body;
  const { user } = req;

  stripe.customers.create({
    email: stripeEmail
    card: stripeToken
  })
  .then(customer => {
        // TODO: save customer in DB
        stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              plan: "standard_subscription",
            },
          ],
        }, function(err, subscription) {
          // asynchronously called
          if (err) {
            console.log('err', err);
            return next(err);
          }
          console.log('subscription', subscription);
          const newSubscription = new Subscription();
          newSubscription.stripe.subscriptionId = subscription.id;
          newSubscription.stripe.customerId = customer.id;
          newSubscription.user = user._id;
          newSubscription.save();
        });
  })
  .catch(err => {
    console.log("Error:", err)
  })
  .then(charge => {
    console.log('charge', charge);
    res.json({charge})
  });
}

export default { create };
