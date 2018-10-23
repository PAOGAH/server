const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

let orderType = 'desc';

firestore
  .collection('licenses')
  .where('status', '==', true)
  .orderBy('createdAt', orderType)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log(doc.data());
    })
  })
  .catch(err => {
    console.log(err);
  })