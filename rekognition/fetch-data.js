const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

firestore
  .collection('licenses')
  .where('text', '==', 'B 805 WYN')
  .where('status', '==', true)
  .get()
    .then(snapshot => {
      if(snapshot.empty) {
        console.log('tidak ada')
      } else {

        snapshot.forEach(doc => {
          firestore.collection('licenses').doc(doc.id).update({ status: false })
          .then(() => console.log('updatetd'))
          .catch(err => console.error(err));
        })
      }
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });