'use strict';

console.log('Loading function');

const AWS = require('aws-sdk');
const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

exports.handler = (event, context, callback) => {

    console.log('Get bucket meta data');

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
      console.log('Get image labels');

      if (err) {
        console.log(err, err.stack);
      }
      else {
        console.log('Want to insert to database');

        const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
        let detectedText = data.TextDetections.map(detected => detected.DetectedText); 
        let plat = detectedText.find(platText => platCriteria.test(platText));
    
        firestore
          .collection('temp')
          .doc(fileName)
          .get()
          .then(snapshot => {
            if (snapshot.exists) {
              // Data already exists
            } else {
              // Insert to Firestore

              firestore
                .collection('licenses')
                .where('text', '==', plat)
                .where('status', '==', true)
                .get()
                  .then(snapshot => {

                    // Uniq license
                    if (snapshot.empty) {
                      firestore
                        .collection('temp')
                        .doc(fileName)
                        .set({
                          fileName
                        })
                        .then(() => {
                          firestore.collection('licenses').add({
                            fileName: fileName,
                            text: plat,
                            status: true,
                            createdAt: new Date().toString(),
                            updatedAt: new Date().toString(),
                            imgTrue: `https://s3.amazonaws.com/${bucketName}/${fileName}`,
                            imgFalse: ''
                          }).then((doc) => {
                              console.log(doc.id, '<=========== INSERTED');
                            })
                            .catch((err) => {
                              console.error(err);
                            })
                        })
                        .catch(err => {
                          console.error(err);
                        })
                    } else {
                      snapshot.forEach(doc => {
                        firestore.collection('licenses').doc(doc.id).update({ status: false })
                        .then(() => console.log(doc.id, '<========== UPDATED'))
                        .catch(err => console.error(err));
                      })
                    }
                  })
                  .catch(err => {
                    console.log('Error getting documents', err);
                  });
            }
          })
          .catch(err => {
            console.log('Error getting documents', err);
          });

        // firestore
        //   .collection('licenses')
        //   .where('text', '==', plat)
        //   .where('status', '==', true)
        //   .get()
        //     .then(snapshot => {

        //       // Uniq license
        //       if (snapshot.empty) {
        //         firestore.collection('licenses').add({
        //           text: plat,
        //           status: true,
        //           createdAt: new Date().toString(),
        //           updatedAt: new Date().toString(),
        //           imgTrue: `https://s3.amazonaws.com/${bucketName}/${fileName}`,
        //           imgFalse: ''
        //         }).then((doc) => {
        //             console.log(doc.id, '<=========== INSERTED');
        //           })
        //           .catch((err) => {
        //             console.error(err);
        //           })
        //       } else {
        //         snapshot.forEach(doc => {
        //           firestore.collection('licenses').doc(doc.id).update({ status: false })
        //           .then(() => console.log(doc.id, '<========== UPDATED'))
        //           .catch(err => console.error(err));
        //         })
        //       }
        //     })
        //     .catch(err => {
        //       console.log('Error getting documents', err);
        //     });
      }
    });

    console.log('end return ----------------');
    return {
      bucketName,
      fileName
    }
};
