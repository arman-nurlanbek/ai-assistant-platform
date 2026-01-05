import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="60vh"
    >
      <CircularProgress color="primary" size={60} thickness={4} />
      <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loader;