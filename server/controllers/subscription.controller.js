import stripe from '../helpers/stripe';
import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import Subscription from '../models/subscription.model';
import User from '../models/user.model';

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
        // TODO: look up customer and see if it already exists?
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
    newSubscription.save()
    .then((subscriptionCreated) => {
      return User.get(user._id).then((_user) => {
        return {_user, subscriptionCreated};
      });
    })
    .then(({_user, subscriptionCreated}) => {
      _user.subscription = subscriptionCreated._id;
      return _user.save();
    })
    .then((_user) => {
      return res.json({'succes': 'sucess'});
    })
    .catch((error) => {
      console.log('error', error);
      let err = new APIError('An error ocurred when creating your subscription.', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
    });

  });
}

export default { create };
