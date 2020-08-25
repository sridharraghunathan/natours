import '@babel/polyfill';
import { login, logout } from './login';
import { displaymapBox } from './mapbox';
import { updateSetting } from './updateSetting';
import { checkoutSession } from './stripe';
import { showAlert } from './alert';

const loginForm = document.querySelector('.form--login');
const mapBox = document.getElementById('map');
const logoutClick = document.querySelector('.nav__el--logout');
const userSaveForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-settings');
const booking = document.getElementById('book-tour');
const alertMessage = document.querySelector('body').dataset.alert;

// there is propert in html called data it store something there we can retrieve from there
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displaymapBox(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (userSaveForm) {
  userSaveForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formInput = new FormData();
    formInput.append('name', document.getElementById('name').value);
    formInput.append('email', document.getElementById('email').value);
    formInput.append('photo', document.getElementById('photo').files[0]);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSetting({ name, email }, 'data');
    updateSetting(formInput, 'data');
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('.btn--passwordUpdate').textContent =
      'Updating.....';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSetting(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--passwordUpdate').textContent =
      'SAVE PASSWORD';
  });
}

if (logoutClick) {
  logoutClick.addEventListener('click', logout);
}

if (booking) {
  booking.addEventListener('click', (e) => {
    checkoutSession(e.target.dataset.tourId);
  });
}

if (alertMessage) showAlert('success', alertMessage);
