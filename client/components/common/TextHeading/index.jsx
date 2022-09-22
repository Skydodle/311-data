import PropTypes from 'prop-types';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  headingBackground: {
    background: theme.palette.primary.main,
    backgroundPosition: 'top',
    height: '15vh',
    position: 'relative',
  },
  headingOverlayText: {
    left: '50%',
    color: 'white',
    fontSize: '40px',
    fontWeight: 'bold',
    position: 'absolute',
    textAlign: 'center',
    top: '50%',
    transform: 'translate(-50%, -70%)',
  },
}));

const TextHeading = ({ children }) => {
  const classes = useStyles();

  return (
    <div className={classes.headingBackground}>
      <div className={classes.headingOverlayText}>
        <Typography variant="h1">{children}</Typography>
      </div>
    </div>
  );
};

TextHeading.propTypes = {
  children: PropTypes.node.isRequired,
};

export default TextHeading;
