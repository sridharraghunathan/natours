import axios from 'axios';
import { showAlert } from './alert';

export const updateSetting = async (data, type) => {

  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMydetails';

    const user = await axios({
      method: 'PATCH',
      url,
      data,
    });

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
