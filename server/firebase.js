const admin = require("firebase-admin");

serviceAccount = JSON.parse(process.env.FIREBASE_SECRET);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cashless-firebase-00.firebaseio.com",
});

exports.getUserfromToken = async idToken => {
    try {
        let decodedToken = await admin.auth().verifyIdToken(idToken);
        let u = await admin.auth().getUser(decodedToken.uid);
        return u.toJSON();
    } catch(e) {
        console.log('error finding user from token:', e.message);
    }
}

exports.setUserDocument = async (email, ssbId) => {
    try {
        let docRef = admin.firestore().collection("users").doc(email);
        let doc = await docRef.get();
        if (doc.exists) {
            console.log('user document already exists');
            return false;
        }
        await docRef.set({id: ssbId});
        return true;
    } catch(e) {
        console.log('error setting user document:', e.message);
        return false;
    }
}