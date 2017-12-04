import stripe from '../helpers/stripe.helper';
import APIError from '../helpers/APIError';
import httpStatus from 'http-status';
import Subscription from '../models/subscription.model';
import User from '../models/user.model';

function cancel(req, res, next) {
  if (req.fullUser && req.fullUser.subscription) {
    const subscriptionId = req.fullUser.subscription.stripe.subscriptionId;
    stripe.subscriptions.del(subscriptionId)
    .then((confirmation) => {
      req.fullUser.subscription.active = false
      return req.fullUser.subscription.save()
      .then((_newSub) => {
        req.fullUser.subscription = null;
        return req.fullUser.save();
      })
      .then( () => {
        res.json({success: true});
      });
    })
    .catch((err) => {
      next(err);
    })
  } else {
    next('No subscription exists.');
  }
}

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

export default { create, cancel };
