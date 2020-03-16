var arr = require(__dirname + '/data/DATA_SET_7906.json');

minTempo = 60;
minEnergy = 0.50;
minValence = 0.50;
minDanceability = 0.50;


var filtered = arr.filter(item => 

    item.tempo >= minTempo &&
    item.energy >= minEnergy && 
    item.valence >= minValence &&
    item.danceability >= minDanceability 
    
    
    );

console.log(filtered.length);
