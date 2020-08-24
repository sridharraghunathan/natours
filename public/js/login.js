import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
  //1) Use axios for fetching the API data
  try {
    const login = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(login);
    if (login.data.status === 'Success') {
      showAlert('success', 'Logged in Success');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  console.log('Entry to Logout: ');
  try {
    const logout = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });

    console.log(logout);
    if (logout.data.status === 'success') {
      console.log('Logging Off');
      location.reload(true); // for refreshing the page node js will not refresh we need manually refresh the page
      // so token with wrong will resent and logged off
      console.log('Logging Off done');
    }
  } catch (err) {
    console.log(err.data.message);
    showAlert('error', 'Unable to Logout, Please Try Again After some time');
  }
};
