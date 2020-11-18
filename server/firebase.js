const admin = require('firebase-admin');

if (!process.env.FIREBASE_SECRET) {
  throw 'FIREBASE_SECRET not defined. Cannot continue.';
}
// FIXME:
// currently we need to do this for this to work which sucks
// export FIREBASE_SECRET=`cat firebasesecret.json`

serviceAccount = JSON.parse(process.env.FIREBASE_SECRET);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://cashless-firebase-00.firebaseio.com',
});

exports.getUserFromToken = async idToken => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const u = await admin.auth().getUser(decodedToken.uid);
    return u.toJSON();
  } catch (e) {
    console.log('error finding user from token:', e.message);
  }
};

exports.setUserDocument = async (email, ssbId) => {
  try {
    const docRef = admin
      .firestore()
      .collection('users')
      .doc(email);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('user document already exists');
      return false;
    }
    await docRef.set({ id: ssbId });
    return true;
  } catch (e) {
    console.log('error setting user document:', e.message);
    return false;
  }
};
