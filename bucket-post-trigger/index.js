// const AWS = require('aws-sdk');

// AWS.config = new AWS.Config();
// AWS.config.accessKeyId = "AKIAJOXPA7XXV7BDT5XA";
// AWS.config.secretAccessKey = "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";
// AWS.config.region = "us-east-1";

const { db } = require('./firebase.config');

function postToFirebase () {
  return new Promise((resolve, reject) => {
    db.ref('test').push({
      message: 'hello world'
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('success')
      }
    })
  })
}

exports.handler = async (event) => {
  
  let responseFirebase = await postToFirebase();

  const response = {
      statusCode: 200,
      body: {
        message: 'OK',
        data: responseFirebase
      }
  };
  return response;
};
