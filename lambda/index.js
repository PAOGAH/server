'use strict';

console.log('Loading function');

const AWS = require('aws-sdk');
const { db } = require('./firebase.config');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

// const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = (event, context, callback) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));
    // console.log(event, '<======================= EVENT');

    let bucketName = event["Records"][0]["s3"]["bucket"]["name"];
    let fileName = event["Records"][0]["s3"]["object"]["key"];

    console.log(bucketName, '<=============== BUCKET NAME');
    console.log(fileName, '<============= FILE NAME');

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
      if (err) {
        console.log(err, err.stack);
      }
      else {
        const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
        let detectedText = data.TextDetections.map(detected => detected.DetectedText); 
        let plat = detectedText.find(platText => platCriteria.test(platText));
        console.log(plat, '<=========== PLAT CODE');
    
        db
          .ref('/plat')
          .push({
            text: plat,
            status: 1,
            createdAt: new Date().toDateString()
          }, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log('inserted to firebase');
            }
          });
      }
    });

    return {
      bucketName,
      fileName
    }

    // Get the object from the event and show its content type
    // const bucket = event.Records[0].s3.bucket.name;
    // const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    // const params = {
    //     Bucket: bucket,
    //     Key: key,
    // };
    // s3.getObject(params, (err, data) => {
    //     if (err) {
    //         console.log(err);
    //         const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    //         console.log(message);
    //         callback(message);
    //     } else {
    //         console.log('CONTENT TYPE:', data.ContentType);
    //         callback(null, data.ContentType);
    //     }
    // });
};
