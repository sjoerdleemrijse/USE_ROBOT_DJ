const request = require('request');
const fs = require('fs');
const bota = require('btoa');
const process = require('process');
const Promise = require('bluebird');

const credentials = JSON.parse(fs.readFileSync(__dirname + '/credentials.json'));
const redirect_uri = 'http://localhost:8888/callback';


tracksList = [];
offset = 0;
limit = 100;
songNumber = 7904;
loopNumber = 0;
iterations = Math.ceil(songNumber / 100);
playlistID = "2ezLl6Vd0kt0kMYevXH84e";

//Loop();

if (loopNumber == 0) {
    Run();
}



function Loop() {
    if (loopNumber < iterations - 1) {
        //console.log(loopNumber);

        loopNumber += 1;
        setTimeout(Run, 1);
        console.log((loopNumber * 100) - 100 + " / " + songNumber + "  tracks generated!");

    } else {
        setTimeout(Save, 1000)

    }

}

function Save() {

    console.log(songNumber + " / " + songNumber + "  tracks generated!"); // CONSOLE LOG COMPLETION
    console.log("Track generation completed!")
    console.log("Now dropping duplicate & local files...")

    //FILTER TRACKS WITHOUT ARTIST URI (LOCAL TRACKS)
    var trackListCleaned = tracksList.filter(item =>

        item.artist_uri != null

    );

    console.log(trackListCleaned.length + " songs left. Saving now...") //LOG AMOUNT OF REMAINING SONGS
    fs.writeFileSync( //SAVE JSON OBJECT TO FILE
        __dirname + '/data/Tracks.json',
        JSON.stringify(trackListCleaned, null, 2)
    );
}

function Run() {
    // See if authorization.json exists. If so, use those credentials
    // to query the api

    if (fs.existsSync(__dirname + '/authorization.json')) {
        var authorization = JSON.parse(
            fs.readFileSync(__dirname + '/authorization.json')
        );

        SaveRecentTracks(authorization);

    } else {
        // We don't have authorization yet. Get it using the
        // authorization code.
        AuthorizeWithCode(
            credentials.client_id,
            credentials.client_secret,
            credentials.authorization_code,
            redirect_uri
        ).then(function (tokens) {

            fs.writeFileSync(
                __dirname + '/authorization.json',
                JSON.stringify(tokens, null, 2)
            );

            SaveRecentTracks(tokens);
        })
            .catch(function (error) {
                console.error(error);
                process.exit(0);
            });
    }





    //THIS PART HANDLES THE FETCHING THE TRACKS AND INFORMATION
    // { client_id :: String, client_secret :: String, refresh_token :: String } -> IO
    function SaveRecentTracks(authorization) {

        AuthorizeWithRefreshToken(
            credentials.client_id,
            credentials.client_secret,
            authorization.refresh_token
        ).then(function (newAuthorization) {

            var directory = __dirname + '/data/';

            readFirstTrackFrom(directory + "latest.json")
                .then(function (track) {
                }, function () { /* noop */ })
                .catch(console.error)
                .finally(function () {

                    //for (var i = 0; i < 100; i++) {
                    if (songNumber - (loopNumber * 100) > 100) {
                        limit = 100;

                    } else limit = songNumber % 100;


                    GetRecentTracks(newAuthorization.access_token, limit, loopNumber)
                        .then(function (tracks) {

                            Loop();

                            for (var i = 0; i < limit; i++) { //FILTERS THE DATA RETURNED BY THE API

                                name = tracks.items[i].track.name;
                                artist = tracks.items[i].track.artists[0].name;
                                song_uri = tracks.items[i].track.uri;
                                artist_uri = tracks.items[i].track.artists[0].uri;
                                song_popularity = tracks.items[i].track.popularity

                                tracksList.push({ name, song_uri, artist, artist_uri, song_popularity }); //PUSHES FILTERED LIST TO JSON OBJECT

                                AuthorizeWithRefreshToken(
                                    credentials.client_id,
                                    credentials.client_secret,
                                    authorization.refresh_token
                                ).catch(function (error) {
                                    console.error(error);
                                    process.exit(1);

                                });

                            }
                        });
                    offset += 100; //ADDS 100 TO THE OFFSET (WE CAN ONLY FETCH 100 SONGS AT A TIME, THIS MAKES SURE ALL SONGS IN A PLAYLIST GET DOWNLOADED)


                });

        })
            .catch(function (error) {
                console.error(error);
                process.exit(1);
            });
    }


    //THIS IS OBSOLETE
    // FilePathString -> Promise Error SpotifyTrack
    function readFirstTrackFrom(file) {
        return new Promise(function (resolve, reject) {
            var text = fs.readFileSync(file, 'utf8');
            var content = JSON.parse(text);

            if (content.items.length > 0) {
                resolve(content.items[0]);
            } else {
                reject();
            }

        })
    }

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

                //console.log(response.body)
                resolve(JSON.parse(response.body));



            })
        });
    }

    function AuthorizeWithCode(client_id, client_secret, authorization_code, redirect_uri) {

        var botaAuth = bota(client_id + ":" + client_secret);

        return new Promise(function (resolve, reject) {
            request({
                url: "https://accounts.spotify.com/api/token",
                method: 'POST',
                form: {
                    grant_type: 'authorization_code',
                    code: authorization_code,
                    redirect_uri: redirect_uri
                },
                headers: {
                    'Authorization': "Basic " + botaAuth
                }
            }, function (e, response) {
                if (e) {
                    reject(e);
                    return;
                }
                const body = JSON.parse(response.body);
                if (body.access_token) {
                    resolve(body);
                } else {
                    const err = new Error('Response does not have access_token');
                    err.body = body;
                    reject(err);
                }
            });

        })
    }

    //API CALL TO GET THE TRACKS
    function GetRecentTracks(access_token, lim, iter) {
        return new Promise(function (resolve, reject) {

            //console.log(limit);
            request({

                url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks?limit=" + lim + "&offset=" + iter * 100,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            }, function (e, response) {
                if (e) {
                    reject(e);
                    return;
                }
                resolve(JSON.parse(response.body));





            });
        });
    };

}

