require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');

const app = express();
const spotifyRouter = require('./spotifyRouter');
const musicbrainzRouter = require('./musicbrainzRouter');

const session = require('express-session')
const cookieParser = require('cookie-parser');
const path = require('path');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;

const redirect_uri = 'http://localhost:3000/callback';
const stateKey = 'spotify_auth_state';
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use(cookieParser()); //use cookie-parser middleware
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true, 
  cookie: { httpOnly: true, maxAge: 60000, secure: false }  //add secure: true when switching to https
}));
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  //console.log(req.session); // Log the session object
  next();
});
app.use('/spotify', spotifyRouter);
app.use('/musicbrainz', musicbrainzRouter); 

app.get('/login', function(req, res) { //
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
  res.cookie(stateKey, state);  //set the state in the cookies

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
    
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null; //get the code from the request
  const state = req.query.state || null; //get the state from the request
  const storedState = req.cookies ? req.cookies[stateKey] : null; //get the state from the cookies

  if (state === null || state !== storedState) { //prevent CSRF attacks by checking the state from the request and the state from the cookies are the same
    res.redirect('/' +
      querystring.stringify({
        error: 'state_mismatch rip'
      }));
  } else {
    res.clearCookie(stateKey); //clear the state from the cookies
    axios.post('https://accounts.spotify.com/api/token', { //send a POST request to the Spotify Accounts service to get an access token
      code: code, //get the code from the request
      redirect_uri: redirect_uri, //where to redirect after the user grants or denies permission
      grant_type: 'authorization_code'
    }, { //
      headers: { //send the client id and client secret in the headers
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      }
    })
    .then(response => {
      req.session.access_token = response.data.access_token; //get the access token from the response
      req.session.refresh_token = response.data.refresh_token; //get the refresh token from the response
      req.session.isAuthenticated = true; //set the session to authenticated
      res.redirect('/');
    })
    .catch(error => {
      res.redirect('/' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    });
  }
});

app.get('/session/state', (req, res) => { //check if the session is authenticated
  res.json({ isAuthenticated: !!req.session.isAuthenticated }); 
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:3000`);
});

//util functions
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}