// ─────────────────────────────────────────────────────────────
//  Configuration Firebase
//  Colle ici l'objet "firebaseConfig" fourni par la console Firebase
//  (Paramètres du projet → Vos applications → Application Web).
//  Tant que cette valeur vaut null, l'application tourne en
//  « mode local » (données dans le navigateur, non partagées).
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: "AIzaSyAHQ1h1s35J50Q-ThJxb1jD39X7MIRXN_4",
  authDomain: "salons-du-livre.firebaseapp.com",
  projectId: "salons-du-livre",
  storageBucket: "salons-du-livre.firebasestorage.app",
  messagingSenderId: "936386688685",
  appId: "1:936386688685:web:06c58453ac95ccb01e3824"
};ig);

/* Exemple :
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "salons-du-livre.firebaseapp.com",
  projectId: "salons-du-livre",
  storageBucket: "salons-du-livre.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/

// Points de départ pour le calcul des distances (nouveaux salons)
export const ORIGINS = {
  corbie:  { label: 'Corbie (80800)',  lat: 49.9086, lon: 2.5097 },
  oignies: { label: 'Oignies (62590)', lat: 50.4686, lon: 2.9933 },
};
