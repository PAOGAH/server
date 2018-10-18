const AWS = require('aws-sdk');
const { db } = require('./firebase.config');
const chai = require('chai');
const assert = chai.assert;
const fs = require('fs');

const BUCKET_NAME = 'pakogah-project2';
const BUCKET_KEY = 'platnya.png';

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

function s3(params) {
  const s3 = new AWS.S3();

  return new Promise ((resolve, reject) => {
    s3.upload(params, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    }
  })
}

function rekognition(params) {
  const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

  return new Promise((resolve, reject) => {
    rekognition.detectText(params, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    }
  });
}

describe('Lambda', () => {

  it('should upload image correctly to AWS S3', () => {
    const s3 = new AWS.S3();
    const BUCKET_NAME = 'pakogah-project2';
    const BUCKET_KEY = 'platnya.png';

    fs.readFile('platnya.png', async (err, data) => {
      if (err) {
        throw err;
      } else {
        let params = { Bucket: BUCKET_NAME, Key: BUCKET_KEY, Body: data };

        s3.upload(params, function(err, s3Result) {
          if (err) {
            console.log(err)
          } else {
            assert.isObject(s3Result);

            assert.exists(s3Result['ETag']);
            assert.exists(s3Result['Location']);
            assert.exists(s3Result['key']);
            assert.exists(s3Result['Bucket']);

            assert.isNotNull(s3Result['ETag']);
            assert.isNotNull(s3Result['Location']);
            assert.isNotNull(s3Result['key']);
            assert.isNotNull(s3Result['Bucket']);

            assert.typeOf(s3Result['ETag'], 'string');
            assert.typeOf(s3Result['Location'], 'string');
            assert.typeOf(s3Result['key'], 'string');
            assert.typeOf(s3Result['Bucket'], 'string');

            assert.equal(s3Result['Bucket'], BUCKET_NAME);
            assert.equal(s3Result['key'], BUCKET_KEY);
            assert.equal(s3Result['Location'], `https://${BUCKET_NAME}.s3.amazonaws.com/${BUCKET_KEY}`);

            s3.deleteObject({ Bucket: BUCKET_NAME, Key: BUCKET_KEY }, function(err, data) {
              if (err) console.log(err, err.stack);
            });
          }
        });
      }
    });
  });

  it('should detect text in image using AWS Rekognition', () => {
    const s3 = new AWS.S3();
    const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});
    const BUCKET_NAME = 'pakogah-project2';
    const BUCKET_KEY = 'platnya.png';

    fs.readFile('platnya.png', async (err, data) => {
      if (err) {
        throw err;
      } else {
        let params = { Bucket: BUCKET_NAME, Key: BUCKET_KEY, Body: data };

        s3.upload(params, function(err, s3Result) {
          if (err) {
            console.log(err)
          } else {

            console.log(s3Result)

            let params = {
              "Image": {
                "S3Object": {
                  "Bucket": BUCKET_NAME,
                  "Name": BUCKET_KEY
                }
              }
            }

            rekognition.detectText(params, function(err, data) {
        
              if (err) {
                console.log(err, err.stack);
              }
              else {
                // { TextDetections: 
                //   [ { DetectedText: 'B 64 NJIL',
                //       Type: 'LINE',
                //       Id: 0,
                //       Confidence: 99.11273956298828,
                //       Geometry: [Object] },
               
                assert.isObject(data);
                assert.isObject(data['TextDetections'][0]['Geometry']);

                assert.isArray(data['TextDetections'])
                assert.isAbove(data['TextDetections'].length, 0);

                assert.exists(data['TextDetections'][0]['DetectedText']);
                assert.exists(data['TextDetections'][0]['Type']);
                assert.exists(data['TextDetections'][0]['Id']);
                assert.exists(data['TextDetections'][0]['Confidence']);
                assert.exists(data['TextDetections'][0]['Geometry']);

                assert.isNotNull(data['TextDetections'][0]['DetectedText']);
                assert.isNotNull(data['TextDetections'][0]['Type']);
                assert.isNotNull(data['TextDetections'][0]['Id']);
                assert.isNotNull(data['TextDetections'][0]['Confidence']);

                assert.typeOf(data['TextDetections'][0]['DetectedText'], 'string');
                assert.typeOf(data['TextDetections'][0]['Type'], 'string');
                assert.typeOf(data['TextDetections'][0]['Id'], 'number');
                assert.typeOf(data['TextDetections'][0]['Confidence'], 'number');

                // s3.deleteObject({ Bucket: BUCKET_NAME, Key: BUCKET_KEY }, function(err, data) {
                //   if (err) console.log(err, err.stack);
                // });
              }
            });
          }
        });
      }
    });
  })

});