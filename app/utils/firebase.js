import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC_uQcJnKdChSfN5JA9UChZhB2KLwygosg",
    authDomain: "cashless-firebase-00.firebaseapp.com",
    databaseURL: "https://cashless-firebase-00.firebaseio.com",
    projectId: "cashless-firebase-00",
    storageBucket: "cashless-firebase-00.appspot.com",
    messagingSenderId: "835417134283",
    appId: "1:835417134283:web:b22a0fe71fb282f9ed374e"
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();

const provider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = () => {
    auth.signInWithPopup(provider);
};
