async function fetchAirports() {
    let container = document.querySelector(".resultsContainer");
  
    //empty previous contents
    container.textContent = "";

    //fetch airports
    let res = await fetch("/viewAirports");
    res = await res.json();
    let airports = res.airports;

    //if no airports were found
    if (!airports || airports.length === 0) {
        let noTable = document.createElement("div")
        noTable.className = "noTable";
        noTable.textContent = "No airports found.";
        container.appendChild(noTable);
        return;
    }

    //creating the table and header row
    let table = document.createElement("table");
    let headerRow = document.createElement("tr");

    //creating the headers
    let headers = ["Port Code", "Port Name", "City", "Country"];
    headers.forEach((text) => {
        let th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //adding the rows
    airports.forEach((airport) => {
        let row = document.createElement("tr");
        [airport.port_code, airport.port_name, airport.city, airport.country].forEach((value) => {
            let td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        table.appendChild(row);
    });

    container.appendChild(table);
}

let form = document.querySelector(".addAirportsForm");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let formData = {port_code: form.port_code.value, port_name: form.port_name.value, city: form.city.value, country: form.country.value};

    let res = await fetch("/addAirports", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(formData)
    });

    res = await res.json();

    let msg = form.querySelector(".message strong");
    if(res.error) {
    msg.textContent = res.error;
    } else {
    msg.textContent = "Airport added successfully.";
    }
    fetchAirports();
});

fetchAirports();