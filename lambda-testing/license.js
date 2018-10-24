const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

module.exports = {
  getByLicense (plat) {
    return new Promise((resolve) => {
      firestore
        .collection('licenses')
        .where('text', '==', plat)
        .where('status', '==', true)
        .get()
        .then(snapshot => {
          resolve(snapshot);
        })
    });
  },

  createLicense (plat, s3) {
    return new Promise((resolve, reject) => {
      firestore.collection('licenses').add({
        text: plat,
        status: true,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        imgTrue: `https://s3.amazonaws.com/${s3.bucketName}/${s3.fileName}`,
        imgFalse: ''
      }).then((doc) => {
          resolve(doc);
          // callback(null, { id: doc.id, plat: plat});
        });
    });
  }
}