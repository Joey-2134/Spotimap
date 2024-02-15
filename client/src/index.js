import './style.css';
import Logo from './assets/spotimaplogo.png';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import countriesGeoJSON from './assets/countries.geojson';

let highlightCountries = [];

// Style function to apply different styles based on country name
const countryStyleFunction = (feature) => {
  const name = feature.get('name');
  if (highlightCountries.includes(name)) {
    return new Style({
      stroke: new Stroke({
        color: 'black',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.6)' // Red color with opacity
      })
    });
  } else {
    return new Style({
      stroke: new Stroke({
        color: 'black',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.1)' // Light grey color with opacity
      })
    });
  }
};

// Vector source for the country boundaries
const vectorSource = new VectorSource({
  url: countriesGeoJSON,
  format: new GeoJSON()
});

// Vector layer for countries with the style function applied
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: countryStyleFunction
});

// Initialize the map
const map = new Map({
  target: 'map', // The id of the map element
  layers: [
    new TileLayer({
      source: new OSM() // OpenStreetMap baselayer
    }),
    vectorLayer
  ],
  view: new View({
    center: [0, 0], // Center of the map [long, lat]
    zoom: 2 // Initial zoom level
  })
});

// Async function to check session state
async function checkSessionState() {
    document.getElementById('logo').src = Logo;
    try {
        const response = await fetch('/session/state');
        const data = await response.json();
        if (!data.isAuthenticated) {
            window.location.href = '/login';
        } else {
            showMainContent();
        }
    } catch (error) {
        console.error('Error checking session state:', error);
    }
}

// Async function to display the main content
async function showMainContent() {
    try {
        await displayUserProfile();
        await displayUserPlaylists();
    } catch (error) {
        console.error('Error showing main content:', error);
    }
}

// Fetch and display user profile
async function displayUserProfile() {
    const response = await fetch('/spotify/user/profile');
    if (!response.ok) throw new Error('Failed to fetch user profile');
    const profile = await response.json();
    if (profile.images && profile.images.length > 0) {
        document.getElementById('profile-pic').src = profile.images[0].url;
    }
}

// Fetch and display user playlists
async function displayUserPlaylists() {
    console.log('test');
    const response = await fetch('/spotify/user/playlists');
    if (!response.ok) throw new Error('Failed to fetch user playlists');
    const playlists = await response.json();
    const playlistList = document.getElementById('playlists');
    playlistList.innerHTML = ''; // Clear existing playlists if any
    playlists.items.forEach(createPlaylistItem);
}

// Create and append playlist item to the playlist list
function createPlaylistItem(playlist) {
    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlist-item';
    playlistItem.setAttribute('data-playlist-id', playlist.id);

    if (playlist.images && playlist.images.length > 0) {
        const playlistImage = document.createElement('img');
        playlistImage.src = playlist.images[0].url;
        playlistImage.alt = playlist.name;
        playlistImage.className = 'playlist-image';
        playlistItem.appendChild(playlistImage);
    }

    const playlistName = document.createElement('div');
    playlistName.textContent = playlist.name;
    playlistName.className = 'playlist-name';
    playlistItem.appendChild(playlistName);

    playlistItem.addEventListener('click', async () => { // Note the async keyword here
        try {
            const artists = await handlePlaylistClick(playlist.id, playlist.name); // Wait for the promise to resolve
            console.log('Artists:', artists);
            if (artists) {
                const artistAreas = await sendArtistsToBackend(artists); // Now we can send the artists to the backend
                console.log(artistAreas); // Log the result from the backend
                highlightCountries = artistAreas.artistAreas;
                console.log('Highlight countries:', highlightCountries);
                updateMapStyle();
            }
        } catch (error) {
            console.error('Error processing playlist click:', error);
        }
    });
    

    document.getElementById('playlists').appendChild(playlistItem);
}

// Handle click on playlist item
async function handlePlaylistClick(playlistId, playlistName) {
    console.log(`Playlist clicked: ${playlistName}`);
    try {
        const response = await fetch(`/spotify/user/playlists/${playlistId}/tracks`);
        document.getElementById('playlists').style.display = 'none';
        if (!response.ok) throw new Error('Failed to fetch playlist tracks');
        const data = await response.json();
        //console.log('Playlist tracks:', data.items);
        let artistsSet = new Set();
        let artists = [];
        data.items.forEach(track => {
            track.track.artists.forEach(artist => {
                artistsSet.add(artist.name);
            });
        });
        artists = Array.from(artistsSet);
        //console.log('Artists:', artists);
        return artists;
    } catch (error) {
        console.error('Error getting playlist tracks:', error);
    }
}

async function sendArtistsToBackend(artists) {
    try {
        const response = await fetch('/musicbrainz/artists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ artists })
        });
        if (!response.ok) throw new Error('Failed to send artists to backend');
        const result = await response.json();
        console.log('Full response:', result); // Log the full response
        return result; // Make sure this matches the structure you're expecting
    } catch (error) {
        console.error('Error sending artists to backend:', error);
    }
}


async function displayMap() {

}

function updateMapStyle() {
  vectorLayer.setStyle(countryStyleFunction);
}

document.addEventListener('DOMContentLoaded', checkSessionState);
