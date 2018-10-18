const AWS = require('aws-sdk');
const { db } = require('./firebase.config');
const chai = require('chai');
const assert = chai.assert;
const fs = require('fs');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

function uploadImage(params) {
  
}

describe('Lambda', () => {

  it('should upload image correctly', () => {
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
  })

});