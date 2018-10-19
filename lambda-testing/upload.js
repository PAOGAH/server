const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

const s3 = new AWS.S3();

const BUCKET_NAME = 'pakogah-project';
const BUCKET_KEY = 'platnya.png';

fs.readFile('platnya.png', function (err, data) {
  if (err) {
    throw err;
  } else {
    let params = { Bucket: BUCKET_NAME, Key: BUCKET_KEY, Body: data };

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log("Successfully uploaded data to myBucket/myKey");
      }
    });
  }
});