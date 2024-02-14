const express = require('express');
const axios = require('axios');
require('dotenv').config();
const musicbrainzRouter = express.Router();

musicbrainzRouter.post('/artists', async (req, res) => {
    try {
        const artists = req.body.artists;
        let artistAreas = [];

        for (let artist of artists) {
            await delay(1000);
            const artistData = await fetchArtistArea(artist);
            artistAreas.push(artistData.artists[0].area.name);
        }
        //console.log('Artist Areas:', artistAreas); //test log
        res.json({ artistAreas });

    } catch (error) {
        console.error('Error fetching artist areas:', error);
        res.status(500).send('Error fetching artist areas');
    }
});

async function fetchArtistArea(artist) {
    const endpoint = `http://musicbrainz.org/ws/2/artist?query=artist:${artist}&fmt=json`;
    const headers = {
        'User-Agent': 'SpotiMap/1.0 ( joeygalvin2134@gmail.com )'
    };
    
    const response = await axios.get(endpoint, { headers });
    //console.log('Artist Area:', response.data.artists[0].area.name); //test log
    return response.data;

}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = musicbrainzRouter;