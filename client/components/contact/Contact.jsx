import React from 'react';
import { ToastContainer } from 'react-toastify';
import ContactImage from './ContactImage';
import ContactIntro from './ContactIntro';
import ContactForm from './ContactForm';

import 'react-toastify/dist/ReactToastify.css';

const Contact = () => (
  <>
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
    <div>
      <ContactImage>Contact Us</ContactImage>
      <ContactIntro />
      <ContactForm />
    </div>
  </>
);

export default Contact;
