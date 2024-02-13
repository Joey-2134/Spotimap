const express = require('express');
const axios = require('axios');
require('dotenv').config();
const spotifyRouter = express.Router();

spotifyRouter.get('/user/profile', (req, res) => {
    console.log("Accessing Spotify route");
    if (!req.session.access_token) {
      return res.status(401).send('User is not authenticated');
    }
    fetchSpotifyUserProfile(req.session.access_token)
      .then(response => {
        // Now this block will execute as expected
        res.json(response.data);
        console.log('User Profile:', response.data);
      })
      .catch(error => {
        console.error('Error fetching Spotify user profile:', error);
        res.status(500).send('Error fetching Spotify user profile');
      });
  });
  
spotifyRouter.get('/user/playlists', (req, res) => {
    if (!req.session.access_token) {
      return res.status(401).send('User is not authenticated');
    }
    fetchSpotifyUserPlaylists(req.session.access_token)
      .then(response => {
        res.json(response.data);
        console.log('User Playlists:', response.data);
      })
      .catch(error => {
        console.error('Error fetching Spotify user playlists:', error);
        res.status(500).send('Error fetching Spotify user playlists');
      });
  });

spotifyRouter.get('/user/playlists/:id', (req, res) => {
    if (!req.session.access_token) {
      return res.status(401).send('User is not authenticated');
    }
    fetchSpotifyPlaylist(req.session.access_token, req.params.id)
      .then(response => {
        res.json(response.data);
        console.log('Playlist:', response.data);
      })
      .catch(error => {
        console.error('Error fetching Spotify playlist:', error);
        res.status(500).send('Error fetching Spotify playlist');
      });
  });


  // Helper functions
function fetchSpotifyUserProfile(accessToken) {
    const endpoint = 'https://api.spotify.com/v1/me';
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };
    return axios.get(endpoint, { headers });
  }

function fetchSpotifyUserPlaylists(accessToken) {
    const endpoint = 'https://api.spotify.com/v1/me/playlists';
    const headers = {
        'Authorization': `Bearer ${accessToken}`
      };
    return axios.get(endpoint, { headers });
}

function fetchSpotifyPlaylist(accessToken, playlistId) {
    const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };
    return axios.get(endpoint, { headers });
}

module.exports = spotifyRouter;
