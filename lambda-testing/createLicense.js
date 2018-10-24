const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

module.exports = (plat, s3) => {
  firestore.collection('licenses').add({
    text: plat,
    status: true,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
    imgTrue: `https://s3.amazonaws.com/${s3.bucketName}/${s3.fileName}`,
    imgFalse: ''
  }).then((doc) => {
      callback(null, { id: doc.id, plat: plat});
    });
}