const AWS = require('aws-sdk');
const { db } = require('./firebase.config');

AWS.config.update({ 
  "accessKeyId": "AKIAI2JUHNLGQ6GTCCEA", 
  "secretAccessKey": "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", 
  "region": "us-east-1"
});

const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});

let params = {
  "Image": {
      "S3Object": {
          "Bucket": "pakogah-project",
          "Name": "3650.jpeg"
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
    // console.log(plat);

    db
      .ref('/plat')
      .push({
        text: plat,
        status: 1,
        createdAt: new Date().toDateString()
      });

    // console.log(JSON.stringify(data.TextDetections));
  }
});