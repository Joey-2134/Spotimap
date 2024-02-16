import './style.css';
import Logo from './assets/spotimaplogo.png';

const mapboxAccessToken = process.env.MAPBOXAPITOKEN;


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
                const uniqueCountriesSet = new Set(artistAreas.artistAreas);
                const uniqueCountries = Array.from(uniqueCountriesSet);
                console.log(artistAreas);
                displayMap(uniqueCountries);
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
            body: JSON.stringify({ artists }) // Send artists array as JSON
        });
        if (!response.ok) throw new Error('Failed to send artists to backend');
        const result = await response.json();
        return result; // Handle the result from the backend
    } catch (error) {
        console.error('Error sending artists to backend:', error);
    }
}

function displayMap(artistAreas) {
    console.log('Displaying map');
    let fillColorExpression = ['match', ['get', 'name']];
    console.log('Artist Areas:', artistAreas);

    artistAreas.forEach(country => {
        fillColorExpression.push(country, 'green');
    });

    fillColorExpression.push('rgba(0,0,0,0.5)');

    document.getElementById('map').style.display = 'block';
    mapboxgl.accessToken = mapboxAccessToken;
    const map = new mapboxgl.Map({
        projection: 'mercator',
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/dark-v11', // style URL
        center: [-20, 20], // starting position [lng, lat]
        zoom: 2 // starting zoom
    });

    map.on('load', () => {
        document.getElementById('map').style.display = 'block';

        map.addSource('countries', {
            type: 'geojson',
            data: 'assets/countries.geo.json'
        });

        map.addLayer({
            id: 'countries',
            type: 'fill',
            source: 'countries',
            layout: {},
            paint: {
                'fill-color': fillColorExpression,
                'fill-opacity': 0.4
            }
        });


    });
}

document.addEventListener('DOMContentLoaded', checkSessionState);
