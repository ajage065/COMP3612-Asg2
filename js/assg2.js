const domain = "https://www.randyconnolly.com/funwebdev/3rd/api/f1";
const buttonClasses = ["circuit", "close", "constructor", "driver", "favorite", "results"];

document.addEventListener("DOMContentLoaded", () => {
	const seasonSelect = document.querySelector("#season-form select");
	
	if (!localStorage.getItem("favorites")) emptyFavorites();
	
	document.querySelector("body").addEventListener("click", e => handlePopupClick(e));
	document.querySelector("#logo").addEventListener("click", () => {displayHome()});
	document.querySelector("#home-button").addEventListener("click", () => {displayHome()});
	document.querySelector("#faves-button").addEventListener("click", () => {displayFavorites()});
	document.querySelector("#empty").addEventListener("click", () => {
		emptyFavorites();
		displayFavorites();
	});
	
	seasonSelect.addEventListener("change", async function(){
		if (!localStorage.getItem(`${seasonSelect.value} data`)){
			let loading = document.querySelector("dialog#loading");
			
			loading.showModal();
			let raceData = await fetchURL(`${domain}/races.php?season=${seasonSelect.value}`);
			let resultsData = await fetchURL(`${domain}/results.php?season=${seasonSelect.value}`);
			let qualifyingData = await fetchURL(`${domain}/qualifying.php?season=${seasonSelect.value}`);
			
			if (!(raceData && resultsData && qualifyingData)) return;
			loading.close();
			
			let seasonData = {
				races: JSON.parse(raceData),
				results: JSON.parse(resultsData),
				qualifying: JSON.parse(qualifyingData)
			};
			localStorage.setItem(`${seasonSelect.value} data`, JSON.stringify(seasonData));
		}
			
		createBrowser(seasonSelect.value);
	});	
});

/*******************************************************************************
createBrowser() - Performs setup for the display of a given season's races and
				  related event handlers.

Input:	season	(int)	- Season whose races will be displayed.
*******************************************************************************/
function createBrowser(season){
	let races = JSON.parse(localStorage.getItem(`${season} data`)).races;
	
	document.querySelector("#race-browser thead").addEventListener("click", (e) => {
		if (e.target.nodeName == "BUTTON"){
			displayRaces(handleTableSort(e.target, races, "race-browser"));
		}
	});
	
	displayRaces(races);
}

/*******************************************************************************
displayRaces()	- Populates a table for displaying races present in a given
				  array ordered by index.

Input:	races	(race[])	- Array of races to be displayed.
*******************************************************************************/
function displayRaces(races){
	let table = document.querySelector("#race-browser tbody");
	let tableContent = [];
	let i = 0;
	
	for (let r of races){
		let rowContent = [];
		let button = createButton("Results", r.id, r.year, "results");
		let name = document.createTextNode(r.name);
		
		rowContent.push(document.createTextNode(r.round));
		rowContent.push(name);
		rowContent.push(button);
		
		tableContent[i] = rowContent;
		i++;
	}
	createTable(table, tableContent);
	document.querySelector("#race-browser h2").textContent = `${races[0].year} Races`;

	document.querySelector("#home").style.display = "none";
	document.querySelector("#browse").style.display = "block";
}

/*******************************************************************************
displayHome()	- Hides the browser view and displays the homepage view.
*******************************************************************************/
function displayHome(){
	document.querySelector("#browse").style.display = "none";
	document.querySelector("#browser-results").style.display = "none";
	document.querySelector("#season-form select").value = "";
	document.querySelector("#home").style.display = "flex";
}

/*******************************************************************************
displayRaceInfo()	- Retrives and displays information relating to a race with
					  the given ID.
					  
Input:	raceId	(int)	- ID of the race to be displayed.
		season	(int)	- season in which race took place.
*******************************************************************************/
function displayRaceInfo(raceId, season){
	let race = JSON.parse(localStorage.getItem(`${season} data`)).races.find(obj => obj.id == raceId);
	let raceResults = JSON.parse(localStorage.getItem(`${season} data`)).results.filter(obj => obj.race.id == raceId);
	let raceQualifying = JSON.parse(localStorage.getItem(`${season} data`)).qualifying.filter(obj => obj.race.id == raceId);
	
	let circuit = document.querySelector("#race-circuit button");
	let raceURL = document.querySelector("#race-url a");
	
	document.querySelector("#browser-results h2").textContent = `Results for ${race.year} ${race.name}`;
	document.querySelector("#round").textContent = `Round ${race.round}`;
	document.querySelector("#date").textContent = race.date;
	circuit.textContent = `${race.circuit.name}, ${race.circuit.location}, ${race.circuit.country}`;
	circuit.value = race.circuit.id;
	raceURL.textContent = race.url;
	raceURL.href = race.url;
	
	createQualifying(raceQualifying);
	createResults(raceResults);
	document.querySelector("#browser-results").style.display = "inline-block";
}

/*******************************************************************************
createQualifying() 	- Performs setup for displaying race qualifying and related
					  event handlers.
					  
Input:	qualifying	(qualifying[])	- Qualifying data to be displayed.
*******************************************************************************/
function createQualifying(qualifying){
	document.querySelector("#qualifying thead").addEventListener("click", (e) => {
		if (e.target.nodeName == "BUTTON"){
			displayQualifying(handleTableSort(e.target, qualifying, "qualifying"));
		}
	});
	displayQualifying(qualifying);
}

/*******************************************************************************
displayQualifying()	- Populates a table for displaying qualifying data present
					  in a given array ordered by index.
					  
Input:	qualifying	(qualifying[])	- Qualifying data to be displayed.					  
*******************************************************************************/
function displayQualifying(qualifying){
	let table = document.querySelector("#qualifying tbody");
	let tableContent = []
	let i = 0;
	
	for (let q of qualifying){
		let rowContent = []
		let driver = createButton(`${q.driver.forename} ${q.driver.surname}`, q.driver.ref,
									q.race.year, "driver");
		let constructor = createButton(q.constructor.name, q.constructor.ref, q.race.year, "constructor");
		
		rowContent.push(document.createTextNode(q.position));
		rowContent.push(driver);
		rowContent.push(constructor);
		rowContent.push(document.createTextNode(q.q1));
		rowContent.push(document.createTextNode(q.q2));
		rowContent.push(document.createTextNode(q.q3));
		
		tableContent[i] = rowContent;
		i++;
	}
	createTable(table, tableContent);
	indicateFavorites(table);
}

/*******************************************************************************
createResults()	- Performs setup for displaying race results and related event
				  handlers.
				  
Input: 	results	(result[])	- Results to be displayed.
*******************************************************************************/
function createResults(results){
	for (let i = 1; i < 4; i++){
		let current = results.find(el => el.position === i);
		let topThree = document.querySelector(`#place-${i} button.driver`);
		topThree.textContent = `${current.driver.forename} ${current.driver.surname}`;
		topThree.value = current.driver.ref;
		topThree.dataset.handler = current.race.year;
	}
	
	document.querySelector("#race-results thead").addEventListener("click", (e) => {
		if (e.target.nodeName == "BUTTON"){
			displayResults(handleTableSort(e.target, results, "race-results"));
		}
	});
	displayResults(results);
}

/*******************************************************************************
displayResults()	- Populates a table for displaying results present in a
					  given array ordered by index.
					  
Input:	results	(result[])	- Results to be displayed.
*******************************************************************************/
function displayResults(results){
	let table = document.querySelector("#race-results tbody");
	let tableContent = [];
	let i = 0;
	
	for (let r of results){
		let rowContent = [];
		let driver = createButton(`${r.driver.forename} ${r.driver.surname}`, r.driver.ref,
									r.race.year, "driver");
		let constructor = createButton(r.constructor.name, r.constructor.ref, r.race.year, "constructor");
		
		rowContent.push(document.createTextNode(r.position));
		rowContent.push(driver);
		rowContent.push(constructor);
		rowContent.push(document.createTextNode(r.laps));
		rowContent.push(document.createTextNode(r.points));
		
		tableContent[i] = rowContent;
		i++;
	}
	createTable(table, tableContent);
	indicateFavorites(table);
}

/*******************************************************************************
displayConstructor()	- Populates the constructor view with information
						  related to the given constructor and race results
						  from the given season.
						  
Input:	constructor		- Constructor whose data will be displayed.
		season			- The currently selected season currently on display in 
						  the browser view.
*******************************************************************************/
async function displayConstructor(constRef, season){
	let constructor = await fetchURL(`${domain}/constructors.php?ref=${constRef}`);
	let constResults = await fetchURL(`${domain}/constructorResults.php?constructor=${constRef}&season=${season}`);
	
	if (!(constructor && constResults)){
		return;
	}
	
	constructor = JSON.parse(constructor);
	constResults = JSON.parse(constResults);
	
	let constURL = document.querySelector("#const-url a");
	document.querySelector("#constructor-results h3").textContent = `${season} Race Results`;
	document.querySelector("#const-name").textContent = constructor.name;
	document.querySelector("#const-nation").textContent = `Nationality: ${constructor.nationality}`;
	constURL.href = constructor.url;
	constURL.textContent = constructor.url;
	
	let table = document.querySelector("#constructor-results tbody");
	let tableContent = [];
	let i = 0;
	
	for (let cr of constResults){
		let rowContent = [];
		
		rowContent.push(document.createTextNode(cr.round));
		rowContent.push(document.createTextNode(cr.name));
		rowContent.push(document.createTextNode(`${cr.forename} ${cr.surname}`));
		rowContent.push(document.createTextNode(cr.positionOrder));
		
		tableContent[i] = rowContent;
		i++;
	}
	createTable(table, tableContent);
	
	let dialog = document.querySelector("dialog#constructor");
	let favoriteButton = dialog.querySelector("button.favorite");
	favoriteButton.value = constructor.constructorRef;
	if (isFavorite(favoriteButton.value)) favoriteButton.classList.add("is-favorite");
	favoriteButton.dataset.handler = JSON.stringify(constructor);
	dialog.showModal();
}

/*******************************************************************************
displayConstructor()	- Populates the driver view with information related to 
					      the given driver and race results from the given 
						  season.
						  
Input:	constructor		- Driver whose data will be displayed.
		season			- The currently selected season currently on display in 
						  the browser view.
*******************************************************************************/
async function displayDriver(driverRef, season){
	let driver = await fetchURL(`${domain}/drivers.php?ref=${driverRef}`);
	let driverResults = await fetchURL(`${domain}/driverResults.php?driver=${driverRef}&season=${season}`);
	
	if (!(driver && driverResults)){
		return;
	}
	
	driver = JSON.parse(driver);
	driverResults = JSON.parse(driverResults);
	let results = JSON.parse(localStorage.getItem(`${season} data`)).results;
	
	let driverURL = document.querySelector("#driver-url a");
	document.querySelector("#driver-results h3").textContent = `${season} Race Results`;
	document.querySelector("#driver-name").textContent = `${driver.forename} ${driver.surname}`;
	document.querySelector("#driver-age").textContent = `Born: ${driver.dob} (age ${calcAge(driver.dob)})`;
	document.querySelector("#driver-nation").textContent = `Nationality: ${driver.nationality}`;
	driverURL.href = driver.url;
	driverURL.textContent = driver.url;
	
	let table = document.querySelector("#driver-results tbody");
	let tableContent = [];
	let i = 0;
	
	for (let dr of driverResults){
		let rowContent = [];
		let result = results.find((el) => el.id === dr.resultId);
		
		rowContent.push(document.createTextNode(dr.round));
		rowContent.push(document.createTextNode(dr.name));
		rowContent.push(document.createTextNode(dr.positionOrder));
		rowContent.push(document.createTextNode(result.points));
		
		tableContent[i] = rowContent;
		i++;
	}
	createTable(table, tableContent);
	
	let dialog = document.querySelector("dialog#driver");
	let favoriteButton = dialog.querySelector("button.favorite");
	favoriteButton.value = driver.driverRef;
	if (isFavorite(favoriteButton.value)) favoriteButton.classList.add("is-favorite");
	favoriteButton.dataset.handler = JSON.stringify(driver);
	dialog.showModal();
}

/*******************************************************************************
displayCircuit()	- Populates the circuit view with information related to the
					  given circuit.
					  
Input:	circuit		- Circuit whose data will be displayed.
*******************************************************************************/
async function displayCircuit(circId){
	let circuit = await fetchURL(`${domain}/circuits.php?id=${circId}`);
	
	if (!circuit){
		return;
	}
	
	circuit = JSON.parse(circuit);
	
	let circuitURL = document.querySelector("#circuit-url a");
	document.querySelector("#circuit-name").textContent = circuit.name;
	document.querySelector("#circuit-location").textContent = `Location: ${circuit.location} ${circuit.country}`;
	circuitURL.href = circuit.url;
	circuitURL.textContent = circuit.url;
	
	let dialog = document.querySelector("dialog#circuit");
	let favoriteButton = dialog.querySelector("button.favorite");
	favoriteButton.value = circuit.circuitRef;
	if (isFavorite(favoriteButton.value)) favoriteButton.classList.add("is-favorite");
	favoriteButton.dataset.handler = JSON.stringify(circuit);
	dialog.showModal();
}

/*******************************************************************************
displayFavorites()	- Populates lists in the favorites view with names of
					  objects saved in local storage.
*******************************************************************************/
function displayFavorites(){
	let favorites = JSON.parse(localStorage.getItem("favorites"));
	
	let driverList = document.querySelector("#favorite-drivers ul");
	let constList = document.querySelector("#favorite-constructors ul");
	let circList = document.querySelector("#favorite-circuits ul");
	
	driverList.innerHTML = "";
	constList.innerHTML = "";
	circList.innerHTML = "";
	
	for (let f of favorites){
		let li = document.createElement("li");
		let targetList;
		
		if (Object.hasOwn(f, "driverId")){
			li.textContent = `${f.forename} ${f.surname}`;
			targetList = driverList;
		} else if (Object.hasOwn(f, "constructorId")){
			li.textContent = f.name;
			targetList = constList;
		} else if (Object.hasOwn(f, "circuitId")){
			li.textContent = `${f.name}, ${f.location}`;
			targetList = circList;
		}
		
		targetList.appendChild(li);
	}
	
	document.querySelector("dialog#favorites").showModal();
}

/*******************************************************************************
handlePopupClick()	- Handles clicks on buttons related to popups and view
					  changes. Passes information stored in button's value to 
					  other functions. Additional information used by the handler 
					  is stored in the dataset.handler property.
*******************************************************************************/
function handlePopupClick(e){
	let handlerData = e.target.dataset.handler;
	
	if (e.target.nodeName == "BUTTON"){
		switch(e.target.className.split(' ').find((className) => buttonClasses.includes(className))) {
			case "circuit": 
				displayCircuit(e.target.value);
				break;
			case "close":
				e.target.parentNode.close();
				break;
			case "constructor":
				displayConstructor(e.target.value, handlerData);
				break;
			case "driver":
				displayDriver(e.target.value, handlerData);
				break;
			case "favorite":
				toggleFavorite(JSON.parse(handlerData));
				e.target.classList.toggle("is-favorite");
				break;
			case "results":
				displayRaceInfo(e.target.value, handlerData);
				break;
			default:
				break;
		}
	}
}

/*******************************************************************************
handleTableSort() 	- Handles clicks on table headers for sorting the order in
					  which items are displayed. Marks the header currently
					  dictating the item order.
					  
Input:	header	(Node)		- Header button that triggered the event.
		list	(Object[])	- Array of objects displayed by the button's table.
		id 		(String)	- id of element that holds content displayed by the 
							  table. e.g. qualifying, race-results.
		
Output:	listSorted	(Object[])	- The original list sorted in order specified by
								  the button pressed.
*******************************************************************************/
function handleTableSort(header, list, id){
	let properties = header.value.split('.');
	let listSorted = list.sort((a,b) => sortNestedObj(a, b, properties));
	
	let headers = document.querySelectorAll(`div#${id} button`);
	for (let h of headers){
		h.classList.remove("current-sort");
	}
	header.classList.add("current-sort");

	return listSorted;
}

/*******************************************************************************
fetchURL()	- Fetches API data stored in the given URL.

Input:		url		- URL from which data is fetched.

Returns:	urlData	(string)	- Fetched URL data stored in form of a string.
			null				- Returns null in case that fetching fails.
*******************************************************************************/
function fetchURL(url){
	let loading = document.querySelector("dialog#loading");
	loading.textContent = "Fetching..."
	
	let urlData = fetch(url)
		.then (response => {if (response.ok){
			return response.json();
		} else {
			throw new Error ("fetch has failed");
		}})
		.then (data => JSON.stringify(data))
		.catch (error => {
			loading.textContent = error;
			setTimeout(loading.close(), 5000);
			return null;
		});
	
	return urlData;
}

/*******************************************************************************
sortObj()	- Compares two objects based on the value of the given property for
			  the purpose of sorting them in ascending order.

Input:	a,b 		(Object)	- Objects being compared.
		property	(string)	- Name of the property by which objects are
								  compared.
								  
Returns:	0 if properties are equal in value.
			-1 if a is lower in value.
			1 if a is greater in value.
			
Note: When sorting by laps or points, objects are sorted in descending order.
*******************************************************************************/
function sortObj(a, b, property){
	let cmp;
	
	if (a[property] < b[property]) cmp = -1;
	else if (a[property] > b[property]) cmp = 1;
	else cmp = 0;
	
	if (property == "laps" || property == "points") cmp *= -1;
	
	return cmp;
}

/*******************************************************************************
sortNestedObj()  - Compares two objects based on the value of a property of a
				   nested object. e.g. comparing a.race.id and b.race.id.
				
Input: 	a,b 		(Object)	- Objects being compared.
		properties	(string[])	- Names of properties in order nesting. e.g.
								  race.id => ["race", "id"].
*******************************************************************************/
function sortNestedObj(a, b, properties){
	let i = 0;
	while (i < properties.length - 1){
		a = a[properties[i]];
		b = b[properties[i]];
		i++;
	}
	return sortObj(a, b, properties[i]);
}

/*******************************************************************************
calcAge()	- Calculates age of a driver based on their date of birth.

Returns:	age (int)	- Subtracts birth year from current year.
*******************************************************************************/
function calcAge(dob){
	let birthyear = dob.split('-')[0];
	
	return 2024 - birthyear;
}

/*******************************************************************************
createTable()	- Populates a table with nodes stored in the given 2D array.

Input:	tbody			(Node)	 	- Body of the table being populated.
		tableContent	(Node[][])	- 2D array of nodes with which the table is
									  populated.
*******************************************************************************/
function createTable(tbody, tableContent){
	tbody.innerHTML = "";
	
	for (let i = 0; i < tableContent.length; i++){
		let tr = document.createElement("tr");
		
		for (let j = 0; j < tableContent[i].length; j++){
			let td = document.createElement("td");			
			td.appendChild(tableContent[i][j])
			tr.appendChild(td);
		}
		
		tbody.appendChild(tr);
	}
}

/*******************************************************************************
createButton()	- Creates a button element with the given properties.

Input:	textContent 	(string)	- Desired text content of the button.
		value						- Desired value of button.
		handlerData					- Data to be stored in dataset.handler.
		className		(string)	- Class to be assigned to the button.
*******************************************************************************/
function createButton(textContent, value, handlerData, className){
	let button = document.createElement("button");
	
	button.textContent = textContent;
	if (value) button.value = value;
	if (handlerData) button.dataset.handler = handlerData;
	if (className) button.classList.add(`${className}`);
	
	return button;
}

/*******************************************************************************
toggleFavorite()	- Stores the given item in local storage under favorites
					  or clears it from favorites if it is already present.
					  
Input:	item 	(Object)	- Item whose data will be stored or cleared.
*******************************************************************************/
function toggleFavorite(item){
	let category = "";
	
	if (Object.hasOwn(item, "constructorId")) category = "constructor";
	else if (Object.hasOwn(item, "driverId")) category = "driver";
	else if (Object.hasOwn(item, "circuitId")) category = "circuit";
	
	if (!category) return;
	console.log(item);
	
	let itemId = item[`${category}Id`];
	let favorites = JSON.parse(localStorage.getItem("favorites"));
	console.log(favorites);
	let duplicate = favorites.find((obj) => obj[`${category}Id`] == itemId);
	
	if (duplicate) favorites = favorites.filter((obj) => obj[`${category}Id`] != itemId);
	else favorites.push(item);
	
	localStorage.setItem("favorites", JSON.stringify(favorites));
}

/*******************************************************************************
emptyFavorites()	- Clears all data in local storage stored under favorites.
*******************************************************************************/
function emptyFavorites(){
	localStorage.setItem("favorites", "[]");
}

/*******************************************************************************
indicateFavorites()		- Indicates whether the data related to a table field
						  is stored under favorites.
						  
Input:	table	(Node)	- Table being queried for favorites.
*******************************************************************************/
function indicateFavorites(table){
	let tds = table.querySelectorAll("td");
	
	for (let td of tds){
		if (td.hasChildNodes()){
			let child = td.firstChild;
			
			if (isFavorite(child.value)){
				let heart = document.createElement("img");
				heart.src = "images/heart.svg";
				heart.classList.add("heart");
				td.appendChild(heart);
			};
		}
	}
}

/*******************************************************************************
isFavorite()	- Checks whether data related to the reference is stored under
				  favorites.
				  
Input:	reference	(string)	- Reference to an item.

Returns:	true	- If data related to the reference is currently saved.
			false	- Otherwise returns false.
*******************************************************************************/
function isFavorite(reference){
	const favorites = JSON.parse(localStorage.getItem("favorites"));
	
	if (favorites.find((obj) => (obj["driverRef"] != undefined && obj["driverRef"] == reference) ||
								(obj["constructorRef"] != undefined && obj["constructorRef"] == reference) ||
								(obj["circuitRef"] != undefined && obj["circuitRef"] == reference)))
		return true;
		
	return false;
}