// Async function to check session state
async function checkSessionState() {
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

    playlistItem.addEventListener('click', () => handlePlaylistClick(playlist.id, playlist.name));
    document.getElementById('playlists').appendChild(playlistItem);
}

// Handle click on playlist item
async function handlePlaylistClick(playlistId, playlistName) {
    console.log(`Playlist clicked: ${playlistName}`);
    try {
        const response = await fetch(`/spotify/user/playlists/${playlistId}`);
        if (!response.ok) throw new Error('Failed to fetch playlist');
        const playlistData = await response.json();
        console.log('Playlist data:', playlistData);
        document.getElementById('playlists').style.display = 'none';
        // You might want to call a function here to display playlist details
    } catch (error) {
        console.error('Error fetching playlist data:', error);
    }
}

document.addEventListener('DOMContentLoaded', checkSessionState);
