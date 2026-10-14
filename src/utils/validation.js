import { Strings } from '../constants/strings';

export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
};

export const validateLoginForm = (identifier, password) => {
  const errors = {};
  if (!identifier || !identifier.trim()) {
    errors.identifier = Strings.pleaseTypeEmail || 'Please enter email or username';
  }
  if (!password) {
    errors.password = Strings.pleaseTypeOldPassword || 'Please enter password';
  } else if (password.length < 6) {
    errors.password = Strings.passwordMustBeSix;
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProfileForm = (firstName, lastName, email) => {
  const errors = {};
  if (!firstName || !firstName.trim()) {
    errors.firstName = Strings.pleaseTypeFirstName;
  }
  if (!lastName || !lastName.trim()) {
    errors.lastName = Strings.pleaseTypeLastName;
  }
  if (!email || !email.trim()) {
    errors.email = Strings.pleaseTypeEmail;
  } else if (!isValidEmail(email)) {
    errors.email = Strings.enterValidEmail;
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePasswordChangeForm = (oldPassword, newPassword, confirmPassword) => {
  const errors = {};
  if (!oldPassword) {
    errors.oldPassword = Strings.pleaseTypeOldPassword;
  }
  if (!newPassword) {
    errors.newPassword = Strings.pleaseTypeNewPassword;
  } else if (newPassword.length < 6) {
    errors.newPassword = Strings.passwordMustBeSix;
  }
  if (!confirmPassword) {
    errors.confirmPassword = Strings.pleaseRetypePassword;
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  isValidEmail,
  validateLoginForm,
  validateProfileForm,
  validatePasswordChangeForm,
};
