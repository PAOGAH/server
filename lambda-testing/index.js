'use strict';

// console.log('Loading function');

const AWS = require('aws-sdk');
const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

exports.handler = (event, context, callback) => {

    // console.log('Get bucket meta data');

    let bucketName = event["Records"][0]["s3"]["bucket"]["name"];
    let fileName = event["Records"][0]["s3"]["object"]["key"];

    const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

    let params = {
      "Image": {
          "S3Object": {
              "Bucket": bucketName,
              "Name": fileName
          }
      }
    }
    
    rekognition.detectText(params, function(err, data) {
      // console.log('Get image labels');

      if (err) {
        callback(err, null);
      }
      else {
        // console.log('Want to insert to database');

        const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
        let detectedText = data.TextDetections.map(detected => detected.DetectedText); 
        let plat = detectedText.find(platText => platCriteria.test(platText));
    
        firestore
          .collection('licenses')
          .where('text', '==', plat)
          .where('status', '==', true)
          .get()
            .then(snapshot => {

              // Uniq license
              if (snapshot.empty) {
                firestore.collection('licenses').add({
                  text: plat,
                  status: true,
                  createdAt: new Date().toString(),
                  updatedAt: new Date().toString(),
                  imgTrue: `https://s3.amazonaws.com/${bucketName}/${fileName}`,
                  imgFalse: ''
                }).then((doc) => {
                    callback(null, { id: doc.id, plat: plat});
                    // console.log(doc.id, '<=========== INSERTED');
                  })
                  .catch((err) => {
                    callback(err, null);
                    // console.error(err);
                  })
              } else {
                snapshot.forEach(doc => {
                  firestore.collection('licenses').doc(doc.id).update({ status: false })
                  .then(() => {
                    // deleteS3Object(params)
                    // .then(() => {
                    //   return callback(null, { type: 'exists', data: doc.id });  
                    // })
                    // .catch(err => {
                    //   return callback(err, null);  
                    // })
                    callback(null, { id: doc.id, plat: plat});
                    // console.log(doc.id, '<========== UPDATED')
                  })
                  .catch(err => {
                    callback(err, null);
                    // console.error(err);
                  });
                })
              }
            })
            .catch(err => {
              callback(err, null);
              // console.log('Error getting documents', err);
            });
      }
    });
};