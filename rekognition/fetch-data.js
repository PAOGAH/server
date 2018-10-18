const { db } = require('./firebase.config');

db
  .ref('/plat')
  .on('value', (snapshot) => {
    if (!snapshot.val()) {
      console.log('No data found!');
    } else {
      let data = snapshot.val();
      let results = [];

      for(let key in data) {
        results.push({...data[key], id: key});
      }

      console.log(results);
    }
  })