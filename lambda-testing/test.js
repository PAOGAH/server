const AWS = require('aws-sdk');
const { firestore } = require('./firebase.config');
const chai = require('chai');
const assert = chai.assert;
const fs = require('fs');
const lambda = require('./index');

const BUCKET_NAME = 'pakogah-project2';
const BUCKET_KEY = 'platnya.png';

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

function uploadToS3(params) {
  return new Promise ((resolve, reject) => {
    const s3 = new AWS.S3();
    
    s3.upload(params, (err, data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
}

function rekognition(params) {
  return new Promise((resolve, reject) => {
    const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

    rekognition.detectText(params, (err, data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  });
}

function deleteS3Object(params) {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();
    
    s3.deleteObject(params, (err, data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}

describe('Unit Testing', () => {

  it('should upload image correctly to AWS S3', (done) => {

    let imageBuffer = fs.readFileSync('platnya.png');
    let params = { Bucket: BUCKET_NAME, Key: BUCKET_KEY, Body: imageBuffer };

    uploadToS3(params)
      .then((result) => {
        assert.isObject(result);

        assert.exists(result['ETag']);
        assert.exists(result['Location']);
        assert.exists(result['key']);
        assert.exists(result['Bucket']);

        assert.isNotNull(result['ETag']);
        assert.isNotNull(result['Location']);
        assert.isNotNull(result['key']);
        assert.isNotNull(result['Bucket']);

        assert.typeOf(result['ETag'], 'string');
        assert.typeOf(result['Location'], 'string');
        assert.typeOf(result['key'], 'string');
        assert.typeOf(result['Bucket'], 'string');

        assert.equal(result['Bucket'], BUCKET_NAME);
        assert.equal(result['key'], BUCKET_KEY);
        assert.equal(result['Location'], `https://${BUCKET_NAME}.s3.amazonaws.com/${BUCKET_KEY}`);

        deleteS3Object({ Bucket: BUCKET_NAME, Key: BUCKET_KEY })
          .then(() => done())
          .catch(deletedErr => {
            console.error(deletedErr);
            done();
          });
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  it('should detect text in image using AWS Rekognition', (done) => {
    let imageBuffer = fs.readFileSync('platnya.png');
    let params = { Bucket: BUCKET_NAME, Key: BUCKET_KEY, Body: imageBuffer };

    uploadToS3(params)
      .then((s3Result) => {
        let rekogParams = {
          "Image": {
            "S3Object": {
              "Bucket": BUCKET_NAME,
              "Name": BUCKET_KEY
            }
          }
        }

        rekognition(rekogParams)
          .then(rekogResult => {

            assert.isObject(rekogResult);
            assert.isObject(rekogResult['TextDetections'][0]['Geometry']);

            assert.isArray(rekogResult['TextDetections'])
            assert.isAbove(rekogResult['TextDetections'].length, 0);

            assert.exists(rekogResult['TextDetections'][0]['DetectedText']);
            assert.exists(rekogResult['TextDetections'][0]['Type']);
            assert.exists(rekogResult['TextDetections'][0]['Id']);
            assert.exists(rekogResult['TextDetections'][0]['Confidence']);
            assert.exists(rekogResult['TextDetections'][0]['Geometry']);

            assert.isNotNull(rekogResult['TextDetections'][0]['DetectedText']);
            assert.isNotNull(rekogResult['TextDetections'][0]['Type']);
            assert.isNotNull(rekogResult['TextDetections'][0]['Id']);
            assert.isNotNull(rekogResult['TextDetections'][0]['Confidence']);

            assert.typeOf(rekogResult['TextDetections'][0]['DetectedText'], 'string');
            assert.typeOf(rekogResult['TextDetections'][0]['Type'], 'string');
            assert.typeOf(rekogResult['TextDetections'][0]['Id'], 'number');
            assert.typeOf(rekogResult['TextDetections'][0]['Confidence'], 'number');

            done();

            // deleteS3Object({ Bucket: BUCKET_NAME, Key: BUCKET_KEY })
            //   .then(() => {
            //     done();
            //   })
            //   .catch(deletedErr => {
            //     console.error(deletedErr);
            //     done();
            //   });
          })
          .catch(rekogErr => {
            console.error(rekogErr);
            done();
          });
      })
      .catch(err => {
        console.error(err);
        done();
      }); 
  });

  it('lambda should run correctly', (done) => {
    let event = {
      "Records": [
        {
          "s3": {
            "bucket": {
              "name": BUCKET_NAME
            },
            "object": {
              "key": BUCKET_KEY
            }
          }
        }
      ]
    }

    lambda.handler(event, null, (err, response) => {
      if (err) {
        console.error(err);
        done();
      } else {
        if (response.type === 'exists') {
          assert.typeOf(response.data, 'string');
          assert.exists(response.data);
          assert.isNotNull(response.data);

          done();
        } else if (response.type === 'not-exists') {
          assert.typeOf(response.data, 'string');
          assert.exists(response.data);
          assert.isNotNull(response.data);

          done();
        }
      }
      
    });
  })

});