const AWS = require('aws-sdk');

module.exports = (params) => {
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