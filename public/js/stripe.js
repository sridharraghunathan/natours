import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51HJLaMCpYgCveY557qIZDzvprfm0s16v5iGWuELbFKK54muPd7L9tBjVhxAXkg7T5evlPZ35SkjwxrVOzlUenuDT00wRJH038N'
);

export const checkoutSession = async (tourid) => {

  try {
    //1 create an session for the checkout
    const sessionObject = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-Session/${tourid}`,
    });


    //2) create an checkout page for the payment
    await stripe.redirectToCheckout({ sessionId: sessionObject.data.session.id });

  } catch (err) {
    //Alert
    showAlert('error', err);
  }
};
