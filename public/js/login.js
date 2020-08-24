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

  try {
    const logout = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });


    if (logout.data.status === 'success') {

      location.reload(true); // for refreshing the page node js will not refresh we need manually refresh the page
      // so token with wrong will resent and logged off

    }
  } catch (err) {
    // console.log(err.data.message);
    showAlert('error', 'Unable to Logout, Please Try Again After some time');
  }
};
