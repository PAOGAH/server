const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

module.exports = (plat) => {
  return new Promise((resolve, reject) => {
    firestore
      .collection('licenses')
      .where('text', '==', plat)
      .where('status', '==', true)
      .get()
      .then(snapshot => {
        resolve(snapshot);
      })
  });
}