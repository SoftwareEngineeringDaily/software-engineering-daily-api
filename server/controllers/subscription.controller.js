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

function getStripePlanId(planType) {
  // TODO: make this nicer + validate + own function
  var stripePlanId = 'sed_monthly_subscription';
  if (planType === 'monthly'){
    stripePlanId = 'sed_monthly_subscription';
  }
  else if (planType === 'yearly'){
    stripePlanId = 'sed_yearly_subscription';
  }
  else {
    throw 'Invalid plan type';
  }
  return stripePlanId
}

function subscriptionDeletedWebhook(request, response, next) {
  // Retrieve the request's body and parse it as JSON
  console.log('Request type---------', request.body.type);
  if (request.body.type === 'customer.subscription.deleted') {

    const subscriptionId = request.body.data.object.id;
    const customerId = request.body.data.object.customer;
    const objectType = request.body.data.object.object;
    console.log('Request body.data.object.id---------', subscriptionId);
    console.log('Request body.data.object.customer---------', customerId);
    console.log('Request body.data.object.object---------', objectType);

    Subscription.findOne({
      'stripe.subscriptionId': subscriptionId,
        /*'stripe.customerId' : customerId*/ // probably not needed?
    })
    .exec()
    .then((subscription) => {
      if(!subscription) {
        console.log('subscription null', subcription);
        throw 'Subscription not found';
      }

      subscription.active = false
      return subscription.save()
      .then(( subscriptionInactive)=> {
        response.send(200);
      })
    })
    .catch((error) => {
      console.log('stripe subscription not found or error setting to inactive', error);
      response.send(500);
    });
  } else {
    // TODO: log this somewhere...
    console.log('Stripe webhook  (not cancellation?)-----', request.body.data.object);
    response.send(200);
  }

  // Do something with event_json

}

function create(req, res, next) {
  const { stripeToken, planType } = req.body;

  var stripePlanId;
  try {
    stripePlanId = getStripePlanId(planType);
  } catch(error) {
      let err = new APIError('Please choose a plan type.', httpStatus.BAD_REQUEST, true); //eslint-disable-line
      return next(err);
  }

  const { user } = req;
  const stripeEmail = user.email;


  // TODO: check first if stripe subscription already exists?
  // but if we don't, then we have the advantage of records?
  // but we probably don't need to create a new stripe customer though...

  stripe.customers.create({
    email: stripeEmail,
    card: stripeToken
  })
  .then(customer => {
    return stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          plan: stripePlanId,
        },
      ],
    })
  })
  .then((subscription) => {
    return {subscription, customer}
  })
  .then(({subscription, customer}) => {
    const newSubscription = new Subscription();
    newSubscription.stripe.subscriptionId = subscription.id;
    newSubscription.stripe.customerId = customer.id;
    newSubscription.stripe.planId = stripePlanId;
    newSubscription.planFrequency = planType;
    newSubscription.stripe.email = stripeEmail;
    newSubscription.active = true;
    newSubscription.user = user._id;
    return newSubscription.save()
  })
  .then((subscriptionCreated) => {
    return User.get(user._id)
  })
  .then((_user) => {
    return {_user, subscriptionCreated};
  });
  .then(({_user, subscriptionCreated}) => {
    // We actually save the current subscription into the user  .
    // makes it easier when checking on the frontend
    _user.subscription = subscriptionCreated._id;
    return _user.save();
  })
  .then((_user) => {
    return res.json({'succes': 'sucess'});
  })
  .catch((error) => {
    console.log('Error-------', error);
    let err = new APIError('An error ocurred when creating your subscription.', httpStatus.BAD_REQUEST, true); //eslint-disable-line
    return next(err);
  });
}

export default { create, cancel, subscriptionDeletedWebhook };
