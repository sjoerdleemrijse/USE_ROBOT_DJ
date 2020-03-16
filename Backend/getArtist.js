const request = require('request');
const fs = require('fs');
const bota = require('btoa');
const process = require('process');
const Promise = require('bluebird');

const credentials = JSON.parse(fs.readFileSync(__dirname + '/credentials.json'));
const authorization = JSON.parse(fs.readFileSync(__dirname + '/authorization.json'));
const redirect_uri = 'http://localhost:8888/callback';

songArray = require(__dirname + "/data/Tracks.json")
Artists = [];
songNumber = songArray.length;
loopNumber = 0;



if (loopNumber == 0) {
    getArtist();
    console.log("Audio Features are being generated!")
};

function Loop() {
    if (loopNumber < songNumber) {
        setTimeout(getArtist, 5);
        console.log(loopNumber + " / " + songNumber + "  Artist info (genre + popularity) generated!")
    } else {
        setTimeout(Save, 1000)

    }
}

function Save() {

    console.log(songNumber + " / " + songNumber + "  tracks generated!"); // CONSOLE LOG COMPLETION
    console.log("Artist info generation completed!")


    fs.writeFileSync( //SAVE JSON OBJECT TO FILE
        __dirname + '/data/Artists.json',
        JSON.stringify(Artists, null, 2)
    );
};



function getArtist(access_token) {
    AuthorizeWithRefreshToken(credentials.client_id, credentials.client_secret, authorization.refresh_token).then(function (newAuthorization) {
        return new Promise(function (resolve, reject) {




            //console.log(newAuthorization.access_token);


            var id = (songArray[loopNumber]["artist_uri"]).slice(15);


            request({
                url: "https://api.spotify.com/v1/artists/" + id,
                method: 'GET',
                headers: {
                    'Authorization': 'sBearer ' + newAuthorization.access_token
                }
            }, function (e, response) {
                if (e) {
                    reject(e);
                    return;
                }

                x = JSON.parse(response.body);

                genre = x.genres;
                artist_popularity = x.popularity;

                Artists.push({ genre, artist_popularity });


                //Artists.push(JSON.parse(response.body));
                fs.writeFileSync(__dirname + '/data/Artists.json', JSON.stringify(Artists, null, 2))
                //console.log(AudioFeatures);

                resolve(JSON.parse(response.body));

                //console.log(loopNumber);
                loopNumber += 1;
                Loop();


            });


        });
    });
};

function AuthorizeWithRefreshToken(client_id, client_secret, refresh_token) {

    var botaAuth = bota(client_id + ":" + client_secret);

    return new Promise(function (resolve, reject) {
        request({
            url: "https://accounts.spotify.com/api/token",
            method: 'POST',
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            headers: {
                'Authorization': "Basic " + botaAuth
            }
        }, function (e, response) {
            if (e) {
                reject(e)
                return;
            }
            resolve(JSON.parse(response.body));


        })
    });
}