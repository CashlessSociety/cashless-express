// utils.js

import React, { useState, useEffect, useRef } from 'react';

export const useInterval = (callback, delay) => {

  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);


  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export const useStickyState =  (defaultValue, key) => {
  const [value, setValue] = React.useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null
      ? JSON.parse(stickyValue)
      : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export const safeKey = key => {
  if (key == null) {
    throw Error("key unexpectedly null or undefined in safeKey");
  }
  // !! we must never pass ethereum keys to the backend
  const tmp = JSON.parse(JSON.stringify(key));
  delete tmp.eth;
  return tmp;
};

export const keyFileStickyState = () => {
  return useStickyState(null, "keyFile");
};

// export const safeKey = () => {
//   const [keyfile, setKeyFile] = keyFileStickyState();
//   return sanitizeKey(keyfile);
// };