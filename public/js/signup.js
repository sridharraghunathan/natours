import axios from 'axios';
import { showAlert } from './alert';

export const signupUser = async (name, email, password, passwordConfirm) => {
  console.log(name, email, password, passwordConfirm);
  try {
    const signup = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    console.log(signup);
    if (signup.data.status.toLowerCase() === 'success') {
      showAlert('success', 'Your account has been created');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
