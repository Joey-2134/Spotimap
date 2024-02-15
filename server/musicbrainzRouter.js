const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
require('dotenv').config();
const musicbrainzRouter = express.Router();

musicbrainzRouter.post('/artists', async (req, res) => {
    try {
        const validCountries = await getValidCountries(); // Retrieve the list of valid countries
        const artists = req.body.artists;
        let artistAreas = [];

        for (let artist of artists) {
            await delay(1000);
            const artistData = await fetchArtistArea(artist);
            if (artistData.artists[0] && artistData.artists[0].area) {
                // Check if the artist area is a valid country
                const validCountry = validCountries.find(country => country.name === artistData.artists[0].area.name);
                if (validCountry) {
                    artistAreas.push(artistData.artists[0].area.name);
                }
            }
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

async function getValidCountries() {
    const data = await fs.readFile('countries.json', 'utf8'); // Replace with the correct path to your countries.json file
    return JSON.parse(data);
}


module.exports = musicbrainzRouter;