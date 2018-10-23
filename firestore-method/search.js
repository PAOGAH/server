const { firestore } = require('./firebase.config');

firestore.settings({ timestampsInSnapshots: true });

function search(term) {
  term = convertTermForSearching(term);

  firestore
    .collection('licenses')
    .where('status', '==', true)
    .get()
    .then(snapshot => {
      let results = [];
      snapshot.forEach(doc => {
        if(convertTermForSearching(doc.data().text) === term) results.push(doc.data());
      })
      // Array type
      console.log(results);
    })
    .catch(err => {
      console.log(err);
    })
}

function convertTermForSearching(term) {
  return term.toLowerCase().split(' ').join('');
}

search('B 8008 QU');