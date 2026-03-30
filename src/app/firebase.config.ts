import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyD2Rtw1qMew1Tua80ZYBMilrUVSzypcJ6E',
    authDomain: 'movies-ec8a3.firebaseapp.com',
    databaseURL: 'https://movies-ec8a3.firebaseio.com',
    projectId: 'movies-ec8a3',
    storageBucket: 'movies-ec8a3.appspot.com',
    messagingSenderId: '932511714350',
    appId: '1:932511714350:web:7de03d075c18d6ad6923bf',
    measurementId: 'G-E9R6114SYD'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
