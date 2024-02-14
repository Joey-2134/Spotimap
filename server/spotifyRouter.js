const express = require('express');
const axios = require('axios');
require('dotenv').config();
const spotifyRouter = express.Router();

spotifyRouter.get('/user/profile', (req, res) => {
    if (!req.session.access_token) {
      return res.status(401).send('User is not authenticated');
    }
    fetchSpotifyUserProfile(req.session.access_token)
      .then(response => {
        // Now this block will execute as expected
        res.json(response.data);
        //console.log('User Profile:', response.data);
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
        //console.log('User Playlists:', response.data);
      })
      .catch(error => {
        console.error('Error fetching Spotify user playlists:', error);
        res.status(500).send('Error fetching Spotify user playlists');
      });
});

spotifyRouter.get('/user/playlists/:id/tracks', async (req, res) => {
    if (!req.session.access_token) {
        return res.status(401).send('User is not authenticated');
    }

    try {
        const allTracks = await fetchAllPlaylistTracks(req.session.access_token, req.params.id);
        res.json({ items: allTracks }); // Send the array of all tracks as a JSON object
    } catch (error) {
        console.error('Error fetching all playlist tracks:', error);
        res.status(500).send('Error fetching all playlist tracks');
    }
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

async function fetchAllPlaylistTracks(accessToken, playlistId) {
  let allTracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    allTracks = allTracks.concat(response.data.items);
    
    // Set the URL to the 'next' URL provided by Spotify, or null if there are no more tracks
    url = response.data.next;
  }

  return allTracks;
}

module.exports = spotifyRouter;
