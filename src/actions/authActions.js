import { MYBADGES_CONNECT, MYBADGES_DISCONNECT, USER_LOADED, USER_LOADING, AUTH_ERROR, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT_SUCCESS, LOGOUT_FAIL, REFRESH_TOKEN_SUCCESS } from '../actions/types';

import axios from 'axios';
import { returnErrors, returnSuccess } from './messageActions'


// Check token & load user
export const loadUser = () => (dispatch) => {
  // user loading
  dispatch({
    type: USER_LOADING
  });
  const config = {
    success: res => {
      dispatch({
        type: USER_LOADED,
        payload: res.data.user
      });
    },
    error: err => {
      if(err.response){
        dispatch(returnErrors(err.response.data.message, err.response.status));
      }
      dispatch({
        type: AUTH_ERROR
      });
    }
  };
  axios.get(`${process.env.REACT_APP_BLOCKLY_API}/user`, config, dispatch(authInterceptor()))
    .then(res => {
      res.config.success(res);
    })
    .catch(err => {
      err.config.error(err);
    });
};


var logoutTimerId;
const timeToLogout = 14.9*60*1000; // nearly 15 minutes corresponding to the API

// Login user
export const login = ({ email, password }) => (dispatch) => {
  // Headers
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  // Request Body
  const body = JSON.stringify({ email, password });
  axios.post(`${process.env.REACT_APP_BLOCKLY_API}/user`, body, config)
  .then(res => {
    // Logout automatically if refreshToken "expired"
    const logoutTimer = () => setTimeout(
      () => dispatch(logout()),
      timeToLogout
    );
    logoutTimerId = logoutTimer();
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });
    dispatch(returnSuccess(res.data.message, res.status, 'LOGIN_SUCCESS'));
  })
  .catch(err => {
    dispatch(returnErrors(err.response.data.message, err.response.status, 'LOGIN_FAIL'));
    dispatch({
      type: LOGIN_FAIL
    });
  });
};


// Connect to MyBadges-Account
export const connectMyBadges = ({ username, password }) => (dispatch, getState) => {
  // Headers
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  // Request Body
  const body = JSON.stringify({ username, password });
  axios.post(`${process.env.REACT_APP_BLOCKLY_API}/user/badge`, body, config)
  .then(res => {
    var user = getState().auth.user;
    user.badge = res.data.account;
    dispatch({
      type: MYBADGES_CONNECT,
      payload: user
    });
    dispatch(returnSuccess(res.data.message, res.status, 'MYBADGES_CONNECT_SUCCESS'));
  })
  .catch(err => {
    dispatch(returnErrors(err.response.data.message, err.response.status, 'MYBADGES_CONNECT_FAIL'));
  });
};

// Disconnect MyBadges-Account
export const disconnectMyBadges = () => (dispatch, getState) => {
  // Headers
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  axios.put(`${process.env.REACT_APP_BLOCKLY_API}/user/badge`, config)
  .then(res => {
    var user = getState().auth.user;
    user.badge = null;
    dispatch({
      type: MYBADGES_DISCONNECT,
      payload: user
    });
    dispatch(returnSuccess(res.data.message, res.status, 'MYBADGES_DISCONNECT_SUCCESS'));
  })
  .catch(err => {
    dispatch(returnErrors(err.response.data.message, err.response.status, 'MYBADGES_DISCONNECT_FAIL'));
  });
};


// Logout User
export const logout = () => (dispatch) => {
  const config = {
    success: res => {
      dispatch({
        type: LOGOUT_SUCCESS
      });
      dispatch(returnSuccess(res.data.message, res.status, 'LOGOUT_SUCCESS'));
      clearTimeout(logoutTimerId);
    },
    error: err => {
      dispatch(returnErrors(err.response.data.message, err.response.status, 'LOGOUT_FAIL'));
      dispatch({
        type: LOGOUT_FAIL
      });
      clearTimeout(logoutTimerId);
    }
  };
  axios.post('https://api.opensensemap.org/users/sign-out', {}, config)
  .then(res => {
    res.config.success(res);
  })
  .catch(err => {
    if(err.response.status !== 401){
      err.config.error(err);
    }
  });
};


export const authInterceptor = () => (dispatch, getState) => {
  // Add a request interceptor
  axios.interceptors.request.use(
    config => {
      config.headers['Content-Type'] = 'application/json';
      const token = getState().auth.token;
      if (token) {
       config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
   },
   error => {
     Promise.reject(error);
   }
  );

  // Add a response interceptor
  axios.interceptors.response.use(
    response => {
      // request was successfull
      return response;
    },
    error => {
      const originalRequest = error.config;
      const refreshToken = getState().auth.refreshToken;
      if(refreshToken){
        // try to refresh the token failed
        if (error.response.status === 401 && originalRequest._retry) {
              // router.push('/login');
              return Promise.reject(error);
        }
        // token was not valid and 1st try to refresh the token
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = getState().auth.refreshToken;
          // request to refresh the token, in request-body is the refreshToken
          axios.post('https://api.opensensemap.org/users/refresh-auth', {"token": refreshToken})
               .then(res => {
                 if (res.status === 200) {
                   clearTimeout(logoutTimerId);
                   const logoutTimer = () => setTimeout(
                     () => dispatch(logout()),
                     timeToLogout
                   );
                   logoutTimerId = logoutTimer();
                   dispatch({
                     type: REFRESH_TOKEN_SUCCESS,
                     payload: res.data
                   });
                   axios.defaults.headers.common['Authorization'] = 'Bearer ' + getState().auth.token;
                   // request was successfull, new request with the old parameters and the refreshed token
                   return axios(originalRequest)
                          .then(res => {
                             originalRequest.success(res);
                           })
                           .catch(err => {
                             originalRequest.error(err);
                           });
                 }
                 return Promise.reject(error);
               })
               .catch(err => {
                 // request failed, token could not be refreshed
                 if(err.response){
                   dispatch(returnErrors(err.response.data.message, err.response.status));
                 }
                 dispatch({
                   type: AUTH_ERROR
                 });
                 return Promise.reject(error);
               });
        }
      }
      // request status was unequal to 401, no possibility to refresh the token
      return Promise.reject(error);
    }
  );
};
