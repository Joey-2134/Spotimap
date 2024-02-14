const express = require('express');
const axios = require('axios');
require('dotenv').config();
const musicbrainzRouter = express.Router();

musicbrainzRouter.post('/artists', async (req, res) => {
    try {
        const artists = req.body.artists;
        //const response = await fetchArtist(artist);
        //res.json(response.data);
        console.log('Artists:', artists);
        //console.log('Artist:', response.data);
    } catch (error) {
        console.error('Error fetching artist:', error);
        res.status(500).send('Error fetching artist');
    }
});


module.exports = musicbrainzRouter;