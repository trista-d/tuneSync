// register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} // if

// Firebase configuration
    var firebaseConfig = {
    apiKey: "AIzaSyAdfHuOEJDr6laALvDsnJMGH5y_PO_wsNw",
    authDomain: "visualizer-7417b.firebaseapp.com",
    projectId: "visualizer-7417b",
    storageBucket: "visualizer-7417b.appspot.com",
    messagingSenderId: "820413244038",
    appId: "1:820413244038:web:b08cfd845b840117b1e707"
};
 // Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase variables
let db = firebase.database();
let username = ""; // user's unique identifier, used to distinguish them/their Spotify acount in Firebase

let hasPremium = false; // true if user has paid account
let code = window.location.href.split("="); // code put in URL after user signs in
let token = ""; // access token
let analysis = []; // object with audio analysis information of a song
let player; // Spotify web player
let id; // unique id of song or album to play
let albumsTracks; // json for all tracks in an album
let songResults = {}; // songs user has searched for
let signedIn = getCookie("signedIn"); // set in script.js and is a string equal to "true" if user signed into their Spotify
let deviceId = ""; // id of device that's playing music
let progress = 0; // how far in ms a track's playback is
let playType = ""; // item type, either album or song
let position = 0; // track of album to begin playback from
let currentTrack = ""; // id of current track playing, used to detect song end
let isMobile = false; // checks if browser is mobile, since Spotify web playback isn't compatibale with mobile devices
let numTracks = 1; // number of tracks to play, > 1 when playing an album
let visualType = 0; // default visualizer animation setting
let index; // index in songResults array that user selects
let refresh = getCookie("refreshToken") != null ? getCookie("refreshToken") : ""; // Spotify refresh token for logged in users
let recent; // object containing info of recently played song
let settings = {}; // user selected visualizer options
let isPaused = false; // true if signed in user's music is paused

// NOTE: USING innerHTML TO CHANGE ELEMENTS IN ANY WAY, NO MATTER HOW UNRELATED, WILL STOP SPOTIFY WEBPLAYER FROM WORKING
// ALSO IF THE VISAULIZER STOPS MOVING IN THE MIDDLE OF A SONG, IT ISN'T BROKEN, THE SPOTIFY ANALYSIS DATA IS JUST INCOMPLETE FOR THE SONG (there's nothing I can do about that)

window.onload = async function() {
        
	// container for search bar, button, and dropdown
	let container = d3.select("body").append("div")
			  .attr("id", "searchCont")
			  .attr("class", "container align-items-center mt-4");
	
	container.append("h1").html('TuneS<span class="pinkText">y</span>nc').attr('id', 'searchTitle');

	let row = container.append("div")
			  .attr("class", "row");

	let col = row.append('div').attr("class", "col-4");
	let col2 = row.append("div").attr("class", "col-8");
	
	// select menu
	let dropdown = col.append("select")
				   .attr("class", "form-select")
				   .attr("id", "type");
    
	// select options
    dropdown.append("option")
   .attr("value", 'track')
   .html("Tracks");
    
    dropdown.append("option")
	.attr("value", 'album')
	.html("Albums");
	
	let row2 = col2.append("div").attr("class", "row");
	let col3 = row2.append("div").attr("class", "col form-group");
	
	// search bar
	col3.append("input")
	.attr("type", "search")
	.attr("class", "form-control")
	.attr("id", "search")
	.attr("placeholder", "Search for music");
	
	// search button
	col3.append("button")
	.attr("class", "btn")
	.attr("id", "searchBtn")
	.attr("aria-label", "search")
	.attr("onclick", "search(document.getElementById('search').value, document.getElementById('type').value)")
	.html('<i class="bi bi-search"></i>');
	
	
	// checks if user logged in
	if (signedIn == "true") {  
        
        // prevent access token errors from page reloading
        window.addEventListener("beforeunload", (event) => {
            document.cookie = "refreshToken=" + refresh;
        }); 
        
		// authenticate user in firebase so they can write to the database
		firebase.auth().onAuthStateChanged((user) => {});
		
		firebase.auth().signInAnonymously();
		
		// wait for function to get access token
		await getAccessToken("authorization_code");

		// check to see if user has a premium or free account
		fetch("https://api.spotify.com/v1/me", {
		method : "GET",
		headers: {
			   'Authorization': "Bearer " + token,
		}
		}).then(response => response.json())
		 .then(function(data) {
			 
			// user's profile id in the database
			username = data.id;
			
			if (data.product == "premium") {
				hasPremium = true;
				
				// check if user is in a mobile browser (Spotify web sdk isn't supported on mobile browsers)
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) isMobile = true;})(navigator.userAgent||navigator.vendor||window.opera);
			 
				if (!isMobile) {
					
					// load and initialize web player sdk
					let sdk = document.createElement("SCRIPT");
					sdk.setAttribute("src", "https://sdk.scdn.co/spotify-player.js");
					document.getElementById("header").appendChild(sdk);
					 
					window.onSpotifyPlayerAPIReady = () => {
						player = new Spotify.Player({
						name: 'Web Playback SDK Template',
						getOAuthToken: cb => { cb(token); }
					  });

					  // Error handling
					  player.on('initialization_error', ({ message }) => { console.error(message); });
					  player.on('authentication_error', ({ message }) => { console.error(message); });
					  player.on('account_error', ({ message }) => { console.error(message); });
					  player.on('playback_error', ({ message }) => { console.error(message); });
					 
					 // check when song a ends
					 player.on('player_state_changed', (state) => {
						if (!state.paused && state.position == 0 && currentTrack != state.track_window.current_track.uri) {
							
							// update offset and current song so pausing then playing again will start on correct song
							position++;
							currentTrack = state.track_window.current_track.uri
							
							// reset song progress
							progress = 0;
							
							// show visualizer for next song if there is one
							if (position < numTracks) {
								draw();
							} else {
                                d3.select("body").append("div").attr("class", "container")
                                .append("div")
                                .html('Thanks for listening! Head <a href="' + window.location.href + '" class="btn">here</a> To find more music.');
                            } // else
						} // if
					  });
					};
				} // if
			} // if
		
			// display recently played tracks and albums
			firebase.database().ref(username + "/music").once('value').then((snapshot) => {
				let data = snapshot.val();
                
				let cont = d3.select("body").append("div").attr("class", "container mt-4").attr("id", "home");
				
                // check if the user actually has songs saved under their account
                if (data != null) {
                    cont.append("div").attr("class", "row").append("div").attr("class", "col").html("Recently Played").attr("id", "recents").append("div").html("Select one to listen, or use the search").attr("class", "recentsSub");
				} else {
                    
                    // if no results, show appropriate message and don't display results
                    cont.append("div").html("It looks like you don't have any recently played music. Start listening to see some of it here!").attr("class", "recentsSub");
                    return;
                } // if
                
                let row = cont.append("div").attr("class", "row");
				
                let i = 0;
                let keys = Object.keys(data);
                for (music in data) {
                    
					// get correct image (track and album store them in different places)
					let src = data[music].type == "track" ? data[music].album.images[1].url : data[music].images[1].url;
					
					row.append("div").attr("class", "col-4 mt-4 mb-2")
					.html('<img class="img-fluid" src="' + src + '" alt="' + data[music].name + '"><br>' + data[music].name + " by " + data[music].artists[0].name)
					.attr("onclick", "recent=" + JSON.stringify(data[music]) + ";getAnalysis(this.id, '" + data[music].type + "s')")
					.attr("id", data[music].id);
                    
                    i++;
				} // for
			});
		});
	} else {
		
		// get access token for non-logged in user
		await getAccessToken("client_credentials");
		
		d3.select("#searchCont").append("div")
		.attr('class', 'mt-4 recentsSub')
		.attr('id', 'home')
		.html('Go <a href="/" class="btn" id="goHome">home</a> and sign in to view music that you have recently played in the visualizer');
	} // else
}

// get correct type of access token for user
function getAccessToken(grant_type) {   
    
    //  Spotify API variable from dashboard`
    let client_id = 'd2758ac57b2b4808812e70840b3cd8e8';
    let client_secret = '66b197b039744e9b831e4e6b524ba265';
    let redirect_uri = window.location.href.split("?")[0]; // must be authenticated in app settings on Spotify dashboard
        
    let access;
    
    // check if refresh token is needed
	if (refresh != "" && signedIn == "true") {
        let params = new URLSearchParams([['code', code[1]], ['redirect_uri', redirect_uri], ['grant_type', "refresh_token"], ['client_id', client_id], ['client_secret' , client_secret], ['refresh_token', getCookie("refreshToken")]]);
        
        access = fetch("https://accounts.spotify.com/api/token", {
            method : "POST",
            body: params,
            headers: {
               'Authorization': "Basic " + btoa(client_id + ":" + client_secret),
            }
        }).then(response => response.json())
        .then(function(data) {
            
            // save token to global variable
            token = data.access_token;
	 });
    } else {
    let params = new URLSearchParams([['code', code[1]], ['redirect_uri', redirect_uri], ['grant_type', grant_type], ['client_id', client_id], ['client_secret' , client_secret]]);
    
    access = fetch("https://accounts.spotify.com/api/token", {
		method : "POST",
		body: params,
		headers: {
		   'Content-Type': 'application/x-www-form-urlencoded',
		}
	}).then(response => response.json())
	.then(function(data) {
		
		// save token to global variable
		token = data.access_token;
        refresh = data.refresh_token;
	 });
   } // else
	 
    return access;
}// getAccessToken

// search Spotify API for a song based on user input
function search(query, type) {
	
	// remove error message if it displayed
	if (document.getElementById("error")) {
		document.getElementById("error").remove();
	} // if
	
	// remove previous search results if there are any
	if (document.getElementById("title")) {
		d3.select("table").remove();
		document.getElementById("title").remove();
	} // if
	
	// remove recently played
	d3.select("#home").remove();

	
	// don't search if user hasn't typed anything in search bar
	if (query == "") {
		
		// display error message
		let error = d3.select('body').append("div")
					.html("Your search cannot be empty. Please try again.")
					.attr("id", "error");
		return;
	} // if
	
	// make search request to Spotify API
	fetch("https://api.spotify.com/v1/search?q=" + query + "&type=" + type, {
		method : "GET",
		headers: {
		   'Authorization': "Bearer " + token,
		}
	}).then(response => response.json())
	.then(function(data) { 
		
		// save search results globally
		songResults = data;
		
		if (songResults[type + "s"].total == 0) {
			
			// display error message
			let error = d3.select('body').append("div")
						.html("Sorry, no results were found for <b>" + query + "</b>. Try searching again with different terms.")
						.attr("id", "error");
			return;
		} // if
		
		console.log(songResults);
		
		/*let containers = document.getElementsByClassName("container");
		for (let i = 0; i < containers.length; i) {
			containers[i].remove();
		} // for*/
		
		// display search results
		d3.select("body").append("div")
		.html(type + " results for <b>" + query + "</b>. Click on a title to check out its visualizer")
		.attr("id", "title");
		
		// add "s" onto type so it can be used to access songResults object
		type += "s";
		
		let table = d3.select("body").append("table")
					.attr("class", "table table-dark table-striped table-hover");
		
		let head = table.append("thead").append("tr");
		head.append('th').attr("scope", "col").html("Title");
		head.append('th').attr("scope", "col").html("Artist");
		
		let body = table.append('tbody');
		
		let src = "";	
		for (let i = 0; i < data[type].items.length; i++) {
			let row = body.append("tr").attr("scope", "row");
			
			// get correct image (album and track have them stored in different places
			src = type == "tracks" ? data[type].items[i].album.images[2].url : data[type].items[i].images[2].url;

			row.append('td')
			.html('<img class="img-fluid" src="' + src + '" alt="' + data[type].items[i].name + '"><br>' + data[type].items[i].name)
			.attr("onclick", "getAnalysis(this.id, '" + type + "')")
			.attr("id", data[type].items[i].id + "_" + i)
			.attr("class", "resultBtns");
			
			row.append('td')
			.html(data[type].items[i].artists[0].name);
		} // for
     });
} // search

// get analysis data for song user selects & show them the next "screen"
async function getAnalysis(uniqueId, type) {
	id = uniqueId.split("_")[0];
	index = uniqueId.split("_")[1]; // index of chosen search result (in songResults array)
	let url = "";
	let i = 0;
	
	// store globally
	playType = type;
	
	// get tracks in the album if needed
	if (type == "albums") {
		const tracks = await fetch('https://api.spotify.com/v1/albums/' + id + '/tracks', {
			method : "GET",
			headers: {
			   'Authorization': "Bearer " + token,
			}
		}).then(response => response.json())
		.then(function(data) {
			albumTracks = data;
			
            if (recent == null) {
				numTracks = songResults[type].items[index].total_tracks;
			} else {
				numTracks = recent.total_tracks;
			} // else
			
			url = "https://api.spotify.com/v1/audio-analysis/" + albumTracks.items[i].id;
		});
	} else {
		url = "https://api.spotify.com/v1/audio-analysis/" + id;
	} // else
	
	// get the audio analysis data of each song from Spotify API
	for (i = 0; i < numTracks; i++) {
		let trackAnalysis = fetch(url, {
			method : "GET",
			headers: {
			   'Authorization': "Bearer " + token,
			}
		}).then(response => response.json())
		.then(function(data) {
			
			// save response to global variable
			analysis.push(data); 
		});
	} // for
       console.log(analysis);
	
	// remove search function and results from display
	d3.select("table").remove();
	let containers = document.getElementsByClassName("container");
	for (let i = 0; i < containers.length; i) {
		containers[i].remove();
	} // for
	if (document.getElementById("title")) {
		document.getElementById("title").remove();
	} // if
	
	// give user instructions if they can't use the web playback sdk
	if (signedIn == "false") {
		d3.select("#msg").html("Your are not signed in so you cannot play music through the application. You'll have to queue up your music now, then start the visualizer.");
		d3.select("#alert").style("background-color", "#75b798")
		.style("display", "block");
	} else if (!hasPremium) {
		d3.select("#msg").html("Your Spotify account doesn't have external web playback capabilities, so you'll have to queue up your music now, then start the visualizer.");
		d3.select("#alert").style("background-color", "#75b798")
		.style("display", "block");
	} else if (isMobile) {
		d3.select("#msg").html("Sorry, but Spotify doesn't support web playback on mobile browsers. You'll have to queue up your music now, then start the visualizer");
		d3.select("#alert").style("background-color", "#75b798")
		.style("display", "block");
	} else if (!window.navigator.onLine) {
        d3.select("#msg").html("Sorry, You can't stream music while you're offline. You'll have to queue up your music now, then start the visualizer");
		d3.select("#alert").style("background-color", "#75b798")
		.style("display", "block");
    } // if
	

    // set up "start visualizer" page. if the user is signed in they have the option to save
    let container = d3.select("body").append("div").attr("class", "container mt-4");
	
	// song or album title and artist
	if (recent == null) {
		container.append("div").html("<b>" + songResults[type].items[index].name + "</b> by <b>" + songResults[type].items[index].artists[0].name + "</b>").attr("id", "presetTitle");
	} else {
		container.append("div").html("<b>" + recent.name + "</b> by <b>" + recent.artists[0].name + "</b>").attr("id", "presetTitle");
	} // else
		
	let row = container.append("div").attr("class", "row mt-5 mb");
    let row2 = container.append("div").attr("class", "row mt-4 mb");
    let row3 = container.append("div").attr("class", "row mt-4");
	
    // create visualizer options
    row.append("div").attr("class", "col").append("select")
	.attr("id", "visualType")
	.attr("class", "form-select");
    
	d3.select("select").append("option")
	.attr("value", 'wave')
	.html("Wave");
	d3.select("select").append("option")
	.attr("value", 'pulse')
	.html("Circle pulse");
	
	let initialValues = {};
	
	// features for signed in users
	if (signedIn == "true") {
		
		// load user's presets
		let defaults = await firebase.database().ref(username + "/presets").once('value').then((snapshot) => {	
			
            // if user has no presets, give them default ones
            if (snapshot.val() != null) {
					initialValues = snapshot.val()["0"];
			} else { 
                let presets = {"0": {}, "1": {}, "2": {}};
                for (let i = 0; i < 3; i++) {
                    presets[i + ""].visualType = "wave";
                    presets[i + ""].primary = "#ffda6a";
                    presets[i + ""].secondary = "#75b798";
                } // for
                
                db.ref(username + "/presets").update(presets);
				console.log(presets);
				initialValues = presets["0"];
			} // else
		});
		
		// presets select input
		let selection = row.append("div").attr("class", "col").append("select")
		.attr("id", "presetName")
		.attr("class", "form-select");

		selection.append("option")
		.attr("value", '0')
		.html("Custom Preset 1");

		selection.append("option")
		.attr("value", '1')
		.html("Custom Preset 2");
		
		selection.append("option")
		.attr("value", '2')
		.html("Custom Preset 3");
	} else {
		
		// give a signed out user default values
		initialValues["visualType"] = "wave";
		initialValues["primary"] = "#ffda6a";
		initialValues["secondary"] = "#75b798";
	} // else
	
	d3.select("#visualType").value = initialValues.visualType;
		
    // primary color option
	let col = row2.append("div").attr("class", "col");
	col.append("div")
	.html("Primary Color")
	.attr("class","mb-2");
	col.append("input")
    .attr("type","color")
    .attr("id","primary")
    .attr("class","form-control form-control-color")
    .attr("value", initialValues.primary);
	
	// secondary color option
	let col2 = row2.append("div").attr("class", "col");
	col2.append("div")
	.html("Secondary Color")
	.attr("class","mb-2");
    col2.append("div").attr("class", "col")
	.append("input")
    .attr("type","color")
    .attr("id","secondary")
    .attr("class","form-control form-control-color")
    .attr("value", initialValues.secondary);
    
	// "save preset" button, only for signed in users and preset select menu change
	if (signedIn == "true") {
		row3.append("div").attr("class", "col").append("button")
		.html("Save as Preset")
		.attr("onclick","saveCustom()")
		.attr("id","save")
		.attr("class", "btn btn-block");
		
		// change values when the user selects a different preset from the menu
		document.getElementById("presetName").addEventListener('change', () => {
			firebase.database().ref(username + "/presets").once('value').then((snapshot) => {
				let presets = snapshot.val();
				
                let name = document.getElementById("presetName").value;
                let i = ""; // index of presets
				
                switch(name) {
                    case "0": i = "0";
                        break;
                    case "1": i = "1";
                        break;
                    case "2": i = "2";
                        break;
					} // switch
                    
                    document.getElementById("visualType").value = presets[i].visualType;
                    document.getElementById("primary").value = presets[i].primary;
                    document.getElementById("secondary").value = presets[i].secondary;
			});
		});
	} // if

	// "start visualizer" button
	row3.append("div").attr("class", "col").append("button")
	.html("Start Visualizer")
	.attr("onclick","startVisual()")
	.attr("id","start")
	.attr("class", "btn btn-block");
} // getAnalysis

// save user's visualizer settings to firebase under their account
function saveCustom() {
	
	//d3.select("msg").html("Custom presest successfully saved!").style("background-color", "#f44336");
	// info to save
	let preset = {
		"visualType": document.getElementById("visualType").value,
		"primary": document.getElementById("primary").value,
		"secondary": document.getElementById("secondary").value
	};
	let name = document.getElementById("presetName").value;
	
	// save to database and show success message
	db.ref(username + "/presets").update({[name]: preset}).then(function () {
		d3.select("#msg").html("Custom preset saved!");
		d3.select("#alert").style("background-color", "#198754")
		.style("display", "block");
	});
} // saveCustom

// initialize visualizer and make call to play song
async function startVisual() {
	
    // get user selected visualizer options
    settings["visualType"] = document.getElementById("visualType").value;
    settings["primary"] = document.getElementById("primary").value;
    settings["secondary"] = document.getElementById("secondary").value;
    
    // remove visualizer options
    d3.select(".container").remove();
    
	// if user is signed in, save "recently played" music JSON to firebase under their account
	// A user can have up to 6 recently played items (tracks or albums)
	if (signedIn == "true" && recent == null) {
		firebase.database().ref(username + "/music").once('value').then((snapshot) => {
			let data = snapshot.val();
			let isRepeat = false;

			// ensure no tracks or albums are repeated
			for (music in data) {
				if (data[music].id == songResults[playType].items[index].id) {
					isRepeat = true;
				} // if				
			} // for
			
			if (!isRepeat) {
				db.ref(username + "/music").push(songResults[playType].items[index]).then(function () {
					
					// have no more than 6 recently played items
					if (snapshot.numChildren() > 5) {
                        console.log(username + '/music/' + Object.keys(data)[0]);
						db.ref(username + '/music/' + Object.keys(data)[0]).remove();
					} // if
				});
			} // if
        });
	} // if
    
    // create container for pause/title
    d3.select("body").append("div").attr("class", "container").attr("id", "controls");
	// play music if user has web playback capabilities (premium account & not in mobile browser)
	if (hasPremium && !isMobile && window.navigator.onLine) {
		player.on('ready', data => {
            deviceId = data.device_id;
			play();
		});
        player.connect();
	} else {
		
		// otherwise remove the instructions for user to queue up music...
		d3.select("#alert").style("display", "none");
		
		// ...and don't use web sdk
        // instead, give user 5 second countdown to press play on their own music
		await countdown(5);
        draw();
	} // else
} // startVisual

// draw very rough visualizer based on song segments
async function draw() {
	
	// display title and artist of playing song
    d3.select("#current").remove();
    if (playType == "albums") {
        d3.select(".container").append("div")
        .html("Now Playing <b>" + albumTracks.items[position].name + " </b> by <b>" + albumTracks.items[position].artists[0].name + " </b>")
        .attr("id", "current")
        .attr("class", "mt-4");
    } else {
        if (recent == null) {
            d3.select(".container").append("div")
            .html("Now Playing <b>" + songResults.tracks.items[index].name + " </b> by <b>" + songResults.tracks.items[index].artists[0].name + " </b>")
            .attr("id", "current")
            .attr("class", "mt-4");
        } else {
            d3.select(".container").append("div")
           .html("Now Playing <b>" + recent.name + " </b> by <b>" + recent.artists[0].name + " </b>")
           .attr("id", "current")
           .attr("class", "mt-4");
        } // else
    } // else

    let width = (window.innerWidth - 100);
    let height = window.innerHeight - document.getElementById("controls").offsetHeight - 100;   
     
	// create the actual graphics using d3 library
    if (settings.visualType == "wave") {
        
        // waveform
        let data = [];

        let cont = d3.select("body").append("div")
                   .attr("id", "drawContainer")
                   .style("width", width)
                   .style("height", height)
        
        let svg = cont.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('viewBox', '0 0 100 100');
         
        let path = svg.append("path").attr("id", "curve").attr("stroke", settings.primary);
        let curve = d3.line().curve(d3.curveNatural);
		let oldData = "";
		let i = 0;
        let translateX = 0;
        let x = 0;
        while ( i < analysis[position].segments.length) {
            
            // pause drawing if music is paused
            while (isPaused) {
                await new Promise(r => setTimeout(r, 100));
                continue;
            } // while
            
            document.getElementById("curve").getAttribute("d");
            oldData = data;
            data.push([
                analysis[position].segments[i].start * 2,
                Math.abs(analysis[position].segments[i].loudness_start)
            ]);
			
            // if path is too wide for screen "scroll" it over
            let screen = window.innerWidth;
            
            if (document.getElementById("curve").getBoundingClientRect().right >= document.getElementById("drawContainer").getBoundingClientRect().right) {
                x++;
                data.shift();
                translateX = -5 * x;
            } // if
            
            // switch visualizer colors
            if (i % 2 == 0) {
                path.attr("stroke", settings.secondary);
            } else {
                path.attr("stroke", settings.primary);
            } // else
            
            let animation = d3.select('path')
            .transition()
			.duration(analysis[position].segments[i].duration * 1000)
			.attrTween('d', function () { 
				return d3.interpolatePath(line(oldData), line(data)); 
			})
            .attr('d', curve(data))
            .attr("transform", "translate(" + translateX + ", 0)");
            
            // time the drawing with the music
            await new Promise(r => setTimeout(r, analysis[position].segments[i].duration * 1000));
            
            i++;
        } // while
    } else if (settings.visualType == "pulse") {
        
        // circle pulsing on beats
        let cont = d3.select("body").append("div")
            .attr("id", "drawContainer")
            .attr("class", "container")
            .style("width", width)
            .style("height", height);
        
        let svg = cont.append("svg").attr("id", "circle").attr("width", "50%").attr("height", height).attr("viewBox", "0 0 600 600")
        .attr("preserveAspectRatio", "xMinYMid");
        
        let circle = svg.append('circle')
          .attr('cx', "50%")
          .attr('cy', "50%")
          .attr('r', 250)
          .attr('stroke', settings.primary)
          .attr('fill', settings.primary)
        
        let i = 0;
        while ( i < analysis[position].beats.length) {
            
            // pause drawing if music is paused
            while (isPaused) {
                await new Promise(r => setTimeout(r, 100));
                continue;
            } // while
            
            // switch visualizer colors
            if (i % 2 == 0) {
                circle.attr("stroke", settings.secondary);
                circle.attr("fill", settings.secondary);
            } else {
                circle.attr("stroke", settings.primary);
                circle.attr("fill", settings.primary);
            } // else
            
            let animation = d3.select('circle')
            .transition()
            .duration(analysis[position].beats[i].duration * 1000)
            .attr('r', 250);
            
            await new Promise(r => setTimeout(r, analysis[position].beats[i].duration * 1000));

            d3.select('circle')
            .attr('r', 300);
            
            // create ring
            svg.append("circle")
            .attr("fill", "none")
            .attr("stroke", settings.secondary)
            .attr("stroke-width", 10)
            .attr('cx', "50%")
            .attr('cy', "50%")
            .attr('r', 300)
            .transition()
            .duration(2000)
            .attr("r", 50)
            .style("stroke-opacity", 0)
            .remove();

            
            i++;
        } // while
    } // if
	
	d3.select("#drawContainer").remove();
	
	// draw next song if user doesn't have music player access (accounts for offline)
	if (signedIn == "false" || !hasPremium || isMobile || !window.navigator.onLine) {
        position++;
		
		if (position < numTracks) {
			draw();
		} else {
            
            // display ending message if music is done
            d3.select("#controls").remove();
            d3.select("body").append("div").attr("class", "container")
            .append("div")
            .html('Thanks for listening! Head <a href="' + window.location.href + '" class="btn" id="here">here</a> To find more music.')
            .attr("id", "thanks");
        } // else
	} else if (signedIn = "true" && hasPremium && !isMobile && numTracks == 1 && position == 0 && window.navigator.onLine) {
            
            // display ending message if music is done
            d3.select("#controls").remove();
            d3.select("body").append("div").attr("class", "container")
            .append("div")
            .html('Thanks for listening! Head <a href="' + window.location.href + '" class="btn" id="here">here</a> To find more music.')
            .attr("id", "thanks");
    } // if
} // draw

// display countdown timer from passed in time value
async function countdown(t) {
	
	// create timer in HTML
	let timer = document.createElement("DIV");
	timer.setAttribute("id", "timer");
	document.body.insertBefore(timer, document.getElementById("canvas"));

	// countdown every second
	while (t > 0) {
		document.getElementById("timer").textContent = "Press play on your music in " + t + " seconds";

		await new Promise(r => setTimeout(r, 1000));
		t--;
	} // while

	// remove timer element from HTML
	document.getElementById("timer").remove();
} // countdown

// stream music
async function play() {
	let body; // body of PUT request

	// get tracks to play
	if (playType == "albums") {

		body = JSON.stringify({
		"context_uri": "spotify:album:" + id,
		"offset": {
			"position": position,
		},
		"position_ms": progress,
        "volume": 0.5
	});
		
		currentTrack = "spotify:track:" + albumTracks.items[0].id;
	} else {
		body = JSON.stringify({
		"uris": ["spotify:track:" + id],
		"offset": {
			"position": position,
		},
		"position_ms": progress,
        "volume": 0.5
	});
		
		currentTrack = "spotify:track:" + id;
	} // else
     
	// make request to play music
	fetch("https://api.spotify.com/v1/me/player/play?device_id=" + deviceId, {
		method : "PUT",
		body: body,
		headers: {
		   "Content-type": "application/json; charset=UTF-8",
		   'Authorization': 'Bearer ' + token
		}
	}).then(function() {
		
        // resume drawing
        isPaused = false;
        
		let pause;

		// once music is ready, start visualizing it
		if (position == 0 && progress == 0) {
            d3.select("#controls").append("button")
            .attr("id", "pause")
            .attr("class", "btn mt-4");
            
            draw();
		} // if
		
		// insert pause button
        pause = document.getElementById("pause");
		pause.setAttribute("onclick", "pause()");
		pause.textContent = "Pause";
	});
} // play

// pause the music player
function pause() {
  
  // pause music playback
  const stop = fetch("https://api.spotify.com/v1/me/player/pause", {
        method : "PUT",
        body: JSON.stringify({
			device_id: deviceId
		}),
        headers: {
           "Content-type": "application/json; charset=UTF-8",
		   'Authorization': 'Bearer ' + token
        }
    });
	
	// get and save how far user is in song
	stop.then(function() {
		fetch("https://api.spotify.com/v1/me/player/currently-playing", {
		method : "GET",
		headers: {
			   'Authorization': "Bearer " + token,
		}
		}).then(response => response.json())
		.then(function(data) {
			progress = data.progress_ms;
		});
	});
	
	// change pause button to play button
	let unpause = document.getElementById("pause");
	unpause.setAttribute("onclick", "play()");
	unpause.textContent = "Play";
    
    isPaused = true;
} // pause

// gets a cookie's value by name
function getCookie(name) {
  return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
} // getCookie