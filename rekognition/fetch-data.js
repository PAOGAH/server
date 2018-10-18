const { db } = require('./firebase.config');

db
  .ref('/plat')
  .on('value', (snapshot) => {
    if (!snapshot.val()) {
      console.log('No data found!');
    } else {
      console.log(snapshot.val());
    }
  })