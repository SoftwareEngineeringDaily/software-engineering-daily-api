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

    console.log('Request body.data.object.id---------', request.body.data.object.id);
    console.log('Request body.data.object.customer---------', request.body.data.object.customer);
    console.log('Request body.data.object.object---------', request.body.data.object.object);

  }

  // Do something with event_json

  response.send(200);
}

function create(req, res, next) {
  const { stripeToken, planType } = req.body;
  const stripePlanId = getStripePlanId(planType);

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
        // TODO: save customer in DB
        // TODO: look up customer and see if it already exists?
        return stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              plan: stripePlanId,
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
    newSubscription.stripe.planId = stripePlanId;
    newSubscription.planFrequency = planType;
    newSubscription.stripe.email = stripeEmail;
    newSubscription.active = true;
    newSubscription.user = user._id;
    // TODO: store which subcription type we need
    newSubscription.save()
    .then((subscriptionCreated) => {
      return User.get(user._id).then((_user) => {
        return {_user, subscriptionCreated};
      });
    })
    .then(({_user, subscriptionCreated}) => {
      // We actually save the current subscription into the user  .
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

export default { create, cancel, subscriptionDeletedWebhook };
