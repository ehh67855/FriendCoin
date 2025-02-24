// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3qajHAhNFiNMztgn2hXA7PsRA-AvT4Uc",
  authDomain: "friendcoin-6af52.firebaseapp.com",
  projectId: "friendcoin-6af52",
  storageBucket: "friendcoin-6af52.firebasestorage.app",
  messagingSenderId: "31719242366",
  appId: "1:31719242366:web:bcd5857ad801ccc928b62f",
  measurementId: "G-9KV20603RS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
