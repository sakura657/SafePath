import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from '@/config/firebaseConfig';

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const firebaseAuth = getAuth(firebaseApp);

export { firebaseApp, firebaseAuth };
