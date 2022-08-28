import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendGitRequest } from '@reducers/data';
import { showFeedbackSuccess, setErrorModal } from '@reducers/ui';
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import {
  Container,
  Grid,
  Button,
  TextField,
  CircularProgress,
} from '@material-ui/core';

const initialFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  association: '',
  message: '',
  errors: {
    missingFirstName: false,
    missingLastName: false,
    missingEmail: false,
    invalidEmail: false,
    missingMessage: false,
  },
  loading: false,
};

const ContactForm = () => {
  // define the methods to dispatch redux actions
  const dispatch = useDispatch();
  const callSendGitRequest = useCallback(obj => dispatch(sendGitRequest(obj)), [dispatch]);
  const callShowFeedbackSuccess = useCallback(o => dispatch(showFeedbackSuccess(o)), [dispatch]);
  const callShowErrorModal = useCallback(obj => dispatch(setErrorModal(obj)), [dispatch]);

  // mapStateToProps equivalent
  const displayFeedbackSuccess = useSelector(state => state.ui.displayFeedbackSuccess);
  const openErrorModal = useSelector(state => state.ui.error.isOpen);

  const [formValues, setFormValues] = useState(initialFormValues);

  function clearFields() {
    setFormValues({
      ...initialFormValues,
    });
  }

  // initialize component
  useEffect(() => {
    // componentDidMount code goes here...
    clearFields();
    if (!!displayFeedbackSuccess === true) {
      toast.success('We received your message. Our team will contact you at the email address provided.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    if (!!openErrorModal === true) {
      toast.error('We failed to process your message. Please try again later.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    return () => {
      // componentWillUnmount code goes here...
      callShowFeedbackSuccess(false);
      callShowErrorModal(false);
      clearFields();
    };
  }, [callShowErrorModal, callShowFeedbackSuccess, displayFeedbackSuccess, openErrorModal]);

  // helper methods
  function validateEmail(emailAddress) {
    // eslint-disable-next-line
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress)) {
      return true;
    }
    return false;
  }

  const clearErrors = useCallback(() => {
    setFormValues(prevState => ({
      ...prevState,
      ...{
        errors: {
          missingFirstName: false,
          missingLastName: false,
          missingEmail: false,
          invalidEmail: false,
          missingMessage: false,
        },
      },
    }));
  }, []);

  const validateForm = useCallback(() => {
    const noFirstName = formValues.firstName.trim().length === 0;
    const noLastName = formValues.lastName.trim().length === 0;
    const noEmail = formValues.email.trim().length === 0;
    const noMessage = formValues.message.trim().length === 0;
    const incompleteEmail = (!noEmail && !validateEmail(formValues.email));
    if (!noFirstName && !noLastName && !noEmail && !noMessage && !incompleteEmail) {
      return true;
    }

    setFormValues(prevState => ({
      ...prevState,
      ...{
        errors: {
          missingFirstName: noFirstName,
          missingLastName: noLastName,
          missingEmail: noEmail,
          invalidEmail: incompleteEmail,
          missingMessage: noMessage,
        },
      },
    }));
    return false;
  }, [formValues]);

  // event handlers
  const onInputChange = useCallback(event => {
    event.preventDefault();
    const { name, value } = event.target;
    setFormValues(prevState => ({ ...prevState, [name]: value }));
  }, []);

  const handleSubmit = useCallback(event => {
    event.preventDefault();

    if (validateForm()) {
      const body = [
                `First name: ${formValues.firstName}`,
                `Last name: ${formValues.lastName}`,
                `Email: ${formValues.email}`,
                `Association: ${formValues.association || 'Not provided'}`,
                `Message: ${formValues.message}`,
      ].join('\n');

      setFormValues(prevState => ({
        ...prevState,
        ...{
          loading: true,
        },
      }));

      // dispatch action to redux with payload
      callSendGitRequest({ title: formValues.email, body });
    }
  }, [callSendGitRequest,
    formValues.association,
    formValues.email,
    formValues.firstName,
    formValues.lastName,
    formValues.message,
    validateForm]);

  return (
    <Container maxWidth="sm">
      <form id="contact-form" onSubmit={handleSubmit}>
        <Grid container alignItems="center" justify="center" direction="column" style={{ gap: '10px' }}>
          <Grid container alignItems="center" justify="center" direction="row" spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="contact-firstname"
                name="firstName"
                label="First Name *"
                type="text"
                autoComplete="off"
                value={formValues.firstName}
                onChange={onInputChange}
                onFocus={clearErrors}
                error={formValues.errors.missingFirstName}
                helperText={formValues.errors.missingFirstName ? 'Please provide a first name.' : ''}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="contact-lastname"
                name="lastName"
                label="Last Name *"
                type="text"
                autoComplete="off"
                value={formValues.lastName}
                onChange={onInputChange}
                onFocus={clearErrors}
                error={formValues.errors.missingLastName}
                helperText={formValues.errors.missingLastName ? 'Please provide a last name.' : ''}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid container alignItems="center" justify="center" direction="row">
            <Grid item xs={12}>
              <TextField
                id="contact-email"
                name="email"
                label="Email *"
                type="text"
                autoComplete="off"
                value={formValues.email}
                onChange={onInputChange}
                onFocus={clearErrors}
                error={formValues.errors.missingEmail || formValues.errors.invalidEmail}
                helperText={formValues.errors.missingEmail || formValues.errors.invalidEmail ? 'Please provide a valid email address.' : ''}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="contact-association"
                name="association"
                label="Association"
                type="text"
                autoComplete="off"
                value={formValues.association}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} style={{ paddingTop: '8px' }}>
              <TextField
                id="contact-message"
                name="message"
                label="Message *"
                type="text"
                variant="outlined"
                rows={4}
                autoComplete="off"
                value={formValues.message}
                onChange={onInputChange}
                onFocus={clearErrors}
                error={formValues.errors.missingMessage}
                helperText={formValues.errors.missingMessage ? 'Please provide a message.' : ''}
                fullWidth
                multiline
              />
            </Grid>
          </Grid>
          <Grid container direction="column" alignItems="center" justify="center" style={{ paddingTop: '8px' }}>
            <CircularProgress style={{ display: formValues.loading === true ? 'block' : 'none' }} />
            <Button variant="contained" color="primary" type="submit" style={{ display: formValues.loading === false ? 'block' : 'none' }}>
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>

  );
};

export default ContactForm;
