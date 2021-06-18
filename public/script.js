// register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} // if

let redirect_uri = window.location.href + 'new.html'; // location to redirect to after authentication. URL must be authenticated in app settings on Spotify dev dashboard

// direct user to Spotify's login page
function login() {
	
	// SPOTIFY API VARIABLES
	let client_id = 'd2758ac57b2b4808812e70840b3cd8e8'; // client id from Spotify dashboard
	let scopes = 'user-read-private user-read-email streaming user-modify-playback-state user-read-playback-state';

	// document that the user is signing in, for use in new.js
	document.cookie = "signedIn=true";

	// redirect the user to Spotify's login page
	window.location = 'https://accounts.spotify.com/authorize' +
	  '?response_type=code' +
	  '&client_id=' + client_id +
	  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
	  '&redirect_uri=' + encodeURIComponent(redirect_uri);
} // login

// take user directly to new.html
function guest() {
	
	// document that the user is not signing in, for use in new.js
	document.cookie = "signedIn=false";
	
	// redirect
	window.location = redirect_uri;
} // guest