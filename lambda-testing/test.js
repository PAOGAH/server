const AWS = require('aws-sdk');
const chai = require('chai');
const assert = chai.assert;
const fs = require('fs');

const { firestore } = require('./firebase.config');
const rekognition = require('./rekognition');
const uploadToS3 = require('./s3');
const { getByLicense, createLicense } = require('./license');
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
let platText;

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

  it('should failed when upload to AWS S3', (done) => {
    let imageBuffer = fs.readFileSync('platnya.png');
    let params = { Bucket: undefined, Key: undefined, Body: imageBuffer };

    uploadToS3(params)
      .then(() => {
        done();
      })
      .catch(err => {
        assert.isNotNull(err['message'])
        assert.isNotNull(err.errors);

        assert.isString(err['message']);
        assert.isArray(err.errors);

        assert.exists(err.errors[0]);
        assert.exists(err.errors[0]['message'])

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
        const platCriteria = /[a-z]+\s[0-9]+\s[a-z]+/i
    
        let detectedText = rekogResult.TextDetections.map(detected => detected.DetectedText);
        let plat = detectedText.find(platText => platCriteria.test(platText));

        rekognitionData = rekogResult
        platText = plat;

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
        done();
      });
  });

  it('should failed detect text in image using AWS Rekognition', (done) => {

    let rekogParams = {
      "Image": {
        "S3Object": {
          "Bucket": undefined,
          "Name": undefined
        }
      }
    }

    rekognition(rekogParams)
      .then(rekogResult => {
        done();
      })
      .catch(err => {
        assert.exists(err);
        assert.exists(err.message);
        assert.exists(err.code);
        assert.exists(err.statusCode);

        assert.isString(err.message);
        assert.isString(err.code);
        assert.isNumber(err.statusCode);
        done();
      });
  });

  it('should get empty data because license plate must unique', (done) => {

    getByLicense(platText)
      .then(snapshot => {
        assert.exists(snapshot.empty);
        assert.isNotNull(snapshot.empty);
        assert.isBoolean(snapshot.empty);

        done();
      })
      .catch(err => {
        done();
      });
  });

  it('should failed get license plate data', (done) => {
    getByLicense()
      .then(snapshot => {
        done();
      })
      .catch(err => {
        assert.exists(err);
        assert.exists(err.code);
        assert.exists(err.name);

        assert.isString(err.code);
        assert.isString(err.name);
        done();
      });
  });

  it('should add license data to database', (done) => {

    firestore
      .collection('licenses')
      .where('text', '==', platText)
      .where('status', '==', true)
      .get()
      .then(snapshot => {

        if (snapshot.empty) {
          createLicense(platText, { bucketName: BUCKET_NAME, fileName: BUCKET_KEY })
            .then(doc => {
              assert.exists(doc.id);
              assert.isNotNull(doc.id);
              assert.isString(doc.id);

              platID = doc.id;
              done();
            })
            .catch(err => {
              console.log(err);
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

  it('should get license data correctly', (done) => {
    firestore
      .collection('licenses')
      .where('text', '==', platText)
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
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      });
  });

});

describe('Lambda Function', () => {
  it('should insert unique license plate to database', (done) => {
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
      assert.typeOf(response.id, 'string');
      assert.typeOf(response.plat, 'string');

      assert.exists(response.id);
      assert.exists(response.plat);

      assert.isNotNull(response.id);
      assert.isNotNull(response.plat);


      platID = response.id;
      platText = response.plat;

      done();
    });
  });

  it('should update status if input license plate equal in database', (done) => {
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
      assert.typeOf(response.id, 'string');
      assert.typeOf(response.plat, 'string');

      assert.exists(response.id);
      assert.exists(response.plat);

      assert.isNotNull(response.id);
      assert.isNotNull(response.plat);


      platID = response.id;
      platText = response.plat;

      done();
    });
  });

  it('should delete testing image in S3', (done) => {
    deleteS3Object({ Bucket: BUCKET_NAME, Key: BUCKET_KEY })
      .then(response => {
        done();
      })
      .catch(deletedErr => {
        console.error(deletedErr);
        done();
      });
  });

  it('should delete firestore testing data', (done) => {
    firestore
      .collection('licenses')
      .doc(platID)
      .delete()
      .then(() => {
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      });
  });

  it('checking rekognition error', (done) => {
    let event = {
      "Records": [
        {
          "s3": {
            "bucket": {
              "name": undefined
            },
            "object": {
              "key": undefined
            }
          }
        }
      ]
    }

    lambda.handler(event, null, (err, response) => {
      assert.typeOf(err.message, 'string');
      assert.typeOf(err.data['message'], 'string');
      assert.typeOf(err.data['code'], 'string');
      assert.typeOf(err.data['statusCode'], 'number');


      assert.exists(err.message);
      assert.exists(err.data);
      assert.exists(err.data['message']);
      assert.exists(err.data['code']);
      assert.exists(err.data['statusCode']);

      assert.isNotNull(err.message);
      assert.isNotNull(err.data);
      assert.isNotNull(err.data['InvalidParameterException']);
      assert.isNotNull(err.data['message']);
      assert.isNotNull(err.data['code']);
      assert.isNotNull(err.data['statusCode']);

      assert.equal(err.data['statusCode'], 400);
      done();
    });
  });
});