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

// Save Rekognition Data
let rekognitionData;
let platID;

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

        done();
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  it('should detect text in image using AWS Rekognition', (done) => {

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

        rekognitionData = rekogResult

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
      })
      .catch(rekogErr => {
        console.error(rekogErr);
        done();
      });
  });

  it('checking if firestore response is empty', (done) => {
    const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
    let detectedText = rekognitionData.TextDetections.map(detected => detected.DetectedText); 
    let plat = detectedText.find(platText => platCriteria.test(platText));

    firestore
      .collection('licenses')
      .where('text', '==', plat)
      .where('status', '==', true)
      .get()
      .then(snapshot => {
        assert.exists(snapshot.empty);
        assert.isNotNull(snapshot.empty);
        assert.isBoolean(snapshot.empty);
        
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      });
  });

  it('should save rekognition data to firestore if data already exists', (done) => {
    const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
    let detectedText = rekognitionData.TextDetections.map(detected => detected.DetectedText); 
    let plat = detectedText.find(platText => platCriteria.test(platText));

    firestore
          .collection('licenses')
          .where('text', '==', plat)
          .where('status', '==', true)
          .get()
          .then(snapshot => {

            if (snapshot.empty) {
              firestore.collection('licenses').add({
                text: plat,
                status: true,
                createdAt: new Date().toString(),
                updatedAt: new Date().toString(),
                imgTrue: `https://s3.amazonaws.com/${BUCKET_NAME}/${BUCKET_KEY}`,
                imgFalse: ''
              }).then((doc) => {
                  assert.exists(doc.id);
                  assert.isNotNull(doc.id);
                  assert.isString(doc.id);

                  platID = doc.id;
                  done();
                })
                .catch((err) => {
                  console.error(err);
                  done();
                })
            } else {
              console.log('data already exists');
              done();
            }
          })
          .catch(err => {
            console.log('Error getting documents', err);
            done();
          });
  });

  it('should get firebase data correctly', (done) => {
    const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
    let detectedText = rekognitionData.TextDetections.map(detected => detected.DetectedText); 
    let plat = detectedText.find(platText => platCriteria.test(platText));

    firestore
      .collection('licenses')
      .where('text', '==', plat)
      .where('status', '==', true)
      .get()
        .then(snapshot => {

          // Uniq license
          if (snapshot.empty) {
            console.log('data not exists');
            done();

          } else {
            snapshot.forEach(doc => {
              let data = doc.data();
              
              assert.exists(data);
              assert.isNotNull(data);
              assert.isObject(data);

              assert.exists(data.text);
              assert.exists(data.status);
              assert.exists(data.createdAt);
              assert.exists(data.updatedAt);
              assert.exists(data.imgFalse);
              assert.exists(data.imgTrue);

              assert.isNotNull(data.text);
              assert.isNotNull(data.status);
              assert.isNotNull(data.createdAt);
              assert.isNotNull(data.updatedAt);
              assert.isNotNull(data.imgFalse);
              assert.isNotNull(data.imgTrue);

              assert.isString(data.text);
              assert.isString(data.imgTrue);
              assert.isBoolean(data.status);

              done();
            })
          }
        })
        .catch(err => {
          console.log('Error getting documents', err);
          done();
        });
  });

  it('should update firestore data if rekognition data already exists', (done) => {
    const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
    let detectedText = rekognitionData.TextDetections.map(detected => detected.DetectedText); 
    let plat = detectedText.find(platText => platCriteria.test(platText));

    firestore
      .collection('licenses')
      .where('text', '==', plat)
      .where('status', '==', true)
      .get()
        .then(snapshot => {

          // Uniq license
          if (snapshot.empty) {
            console.log('data not exists');
            done();

          } else {
            snapshot.forEach(doc => {
              firestore.collection('licenses').doc(doc.id).update({ status: false })
              .then(() => {
                assert.exists(doc.id);
                assert.isNotNull(doc.id);
                assert.isString(doc.id);

                done();
              })
              .catch(err => {
                console.error(err);
                done();
              });
            })
          }
        })
        .catch(err => {
          console.log('Error getting documents', err);
          done();
        });
  });

  it('should delete firestore data', (done) => {
    firestore
      .collection('licenses')
      .doc(platID)
      .delete()
      .then(() => {
        console.log('data deleted');
        done();
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
  });

  it('should delete license plate image correctly', (done) => {
    deleteS3Object({ Bucket: BUCKET_NAME, Key: BUCKET_KEY })
      .then(response => {
        done();
      })
      .catch(deletedErr => {
        console.error(deletedErr);
        done();
      });
  })

});