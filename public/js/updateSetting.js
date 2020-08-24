import axios from 'axios';
import { showAlert } from './alert';

export const updateSetting = async (data, type) => {
  console.log(data, type);
  try {
    const url =
      type === 'password'
        ? 'http://localhost:8000/api/v1/users/updateMyPassword'
        : 'http://localhost:8000/api/v1/users/updateMydetails';

    const user = await axios({
      method: 'PATCH',
      url,
      data,
    });
    console.log(user);
    if (user.data.data === 'success') {
      showAlert('success', `${type.toUpperCase()} Successfully updated`);
    } else if (user.data.status.toLowerCase() === 'success') {
      showAlert('success', `${type.toUpperCase()} Successfully updated`);
    }
  } catch (err) {
    showAlert(
      'error',
      'Unable to update the request , please try again later!'
    );
  }
};
