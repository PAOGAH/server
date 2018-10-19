'use strict';

const AWS = require('aws-sdk');
const { db } = require('./firebase.config');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

// exports.handler = (event, context, callback) => {

//     console.log('Get bucket meta data');

//     let bucketName = event["Records"][0]["s3"]["bucket"]["name"];
//     let fileName = event["Records"][0]["s3"]["object"]["key"];

//     const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

//     let params = {
//       "Image": {
//           "S3Object": {
//               "Bucket": bucketName,
//               "Name": fileName
//           }
//       }
//     }
    
//     rekognition.detectText(params, function(err, data) {
//       console.log('Get image labels');

//       if (err) {
//         console.log(err, err.stack);
//       }
//       else {
//         console.log('Want to insert to database');

//         const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
//         let detectedText = data.TextDetections.map(detected => detected.DetectedText);
//         let plat = detectedText.find(platText => platCriteria.test(platText));
    
//         db
//           .ref('/plat')
//           .push({
//             text: plat,
//             status: 1,
//             createdAt: new Date().toDateString()
//           }, (err) => {
//             if (err) {
//               console.error(err);
//             } else {
//               console.log('inserted to firebase');
//             }
//           });
//       }
//     });

//     return {
//       bucketName,
//       fileName
//     }
// };
