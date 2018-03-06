import httpStatus from 'http-status';
import stripe from '../helpers/stripe.helper';
import APIError from '../helpers/APIError';
import Subscription from '../models/subscription.model';
import User from '../models/user.model';

function cancel(req, res, next) {
  if (req.fullUser && req.fullUser.subscription) {
    const { subscriptionId } = req.fullUser.subscription.stripe;
    stripe.subscriptions
      .del(subscriptionId)
      .then(() => {
        req.fullUser.subscription.active = false;
        return req.fullUser.subscription
          .save()
          .then(() => {
            req.fullUser.subscription = null;
            return req.fullUser.save();
          })
          .then(() => {
            res.json({ success: true });
          });
      })
      .catch((err) => {
        next(err);
      });
  } else {
    next('No subscription exists.');
  }
}

function getStripePlanId(planType) {
  // TODO: make this nicer + validate + own function
  let stripePlanId = 'sed_monthly_subscription';
  if (planType === 'monthly') {
    stripePlanId = 'sed_monthly_subscription';
  } else if (planType === 'yearly') {
    stripePlanId = 'sed_yearly_subscription';
  } else {
    throw 'Invalid plan type'; // eslint-disable-line
  }
  return stripePlanId;
}

function subscriptionDeletedWebhook(request, response) {
  // Retrieve the request's body and parse it as JSON
  console.log('Request type---------', request.body.type); // eslint-disable-line
  if (request.body.type === 'customer.subscription.deleted') {
    const subscriptionId = request.body.data.object.id;
    const customerId = request.body.data.object.customer;
    const objectType = request.body.data.object.object;
    console.log('Request body.data.object.id---------', subscriptionId); // eslint-disable-line
    console.log('Request body.data.object.customer---------', customerId); // eslint-disable-line
    console.log('Request body.data.object.object---------', objectType); // eslint-disable-line

    Subscription.findOne({
      'stripe.subscriptionId': subscriptionId
      /* 'stripe.customerId' : customerId */ // probably not needed?
    })
      .exec()
      .then((subscription) => {
        if (!subscription) {
          console.log('subscription null', subscription); // eslint-disable-line
          throw 'Subscription not found'; // eslint-disable-line
        }

        subscription.active = false; // eslint-disable-line
        return subscription.save().then(() => {
          response.send(200);
        });
      })
      .catch((error) => {
        console.log('stripe subscription not found or error setting to inactive', error); // eslint-disable-line
        response.send(500);
      });
  } else {
    // TODO: log this somewhere...
    console.log('Stripe webhook  (not cancellation?)-----', request.body.data.object); // eslint-disable-line
    response.send(200);
  }

  // Do something with event_json
}

function create(req, res, next) {
  const { stripeToken, planType } = req.body;

  let stripePlanId;
  try {
    stripePlanId = getStripePlanId(planType);
  } catch (error) {
    let err = new APIError('Please choose a plan type.', httpStatus.BAD_REQUEST, true); //eslint-disable-line
    return next(err);
  }

  const { user } = req;
  const stripeEmail = user.email;

  // TODO: check first if stripe subscription already exists?
  // but if we don't, then we have the advantage of records?
  // but we probably don't need to create a new stripe customer though...

  stripe.customers
    .create({
      email: stripeEmail,
      card: stripeToken
    })
    .then(customer =>
      stripe.subscriptions
        .create({
          customer: customer.id,
          items: [
            {
              plan: stripePlanId
            }
          ]
        })
        .then(subscription => ({ subscription, customer })))
    .then(({ subscription, customer }) => {
      const newSubscription = new Subscription();
      newSubscription.stripe.subscriptionId = subscription.id;
      newSubscription.stripe.customerId = customer.id;
      newSubscription.stripe.planId = stripePlanId;
      newSubscription.planFrequency = planType;
      newSubscription.stripe.email = stripeEmail;
      newSubscription.active = true;
      newSubscription.user = user._id;
      return newSubscription.save();
    })
    .then(subscriptionCreated => User.get(user._id).then(_user => ({ _user, subscriptionCreated })))
    .then(({ _user, subscriptionCreated }) => {
      // We actually save the current subscription into the user  .
      // makes it easier when checking on the frontend
      _user.subscription = subscriptionCreated._id; // eslint-disable-line
      return _user.save();
    })
    .then(() => res.json({ succes: 'sucess' }))
    .catch((error) => {
      try {
        let err = new APIError(error.message, httpStatus.BAD_REQUEST, true); //eslint-disable-line
        return next(err);
      } catch (_error) {
        const err2 = new APIError(
          'An error ocurred when creating your subscription.',
          httpStatus.BAD_REQUEST,
          true
        ); //eslint-disable-line
        return next(err2);
      }
    });
  return null;
}

export default { create, cancel, subscriptionDeletedWebhook };
