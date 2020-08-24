const hideAlert = () => {
  const remove = document.querySelector('.alert');
  if (remove) {
    remove.parentElement.removeChild(remove);
  }
};

export const showAlert = (status, message) => {
  hideAlert();
  const markup = `<div class="alert alert--${status}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 3000);
};
