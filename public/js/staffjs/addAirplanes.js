async function fetchAirplanes(){
    let container = document.querySelector(".resultsContainer");

    //empty previous contents
    container.textContent = "";

    //fetch airplane data
    let res = await fetch("/viewAirplanes");
    res = await res.json();

    let airplanes = res.airplanes;

    //If no airplanes are found
    if(airplanes.length === 0){
        let noTable = document.createElement("div")
        noTable.className = "noTable";
        noTable.textContent = "No airplanes found.";
        container.appendChild(noTable);
        return;
    }

    //creating the table and header row
    let table = document.createElement("table");
    let headerRow = document.createElement("tr");

    //creating the headers
    let headers = ["Plane ID", "Seats", "Manufacturer"];
    headers.forEach(attribute => {
        let th = document.createElement("th");
        th.textContent = attribute;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //adding the rows
    airplanes.forEach(airplane => {
        let row = document.createElement("tr");

        let planeIDCell = document.createElement("td");
        planeIDCell.textContent = airplane.plane_ID;
        row.appendChild(planeIDCell);
        let seatsCell = document.createElement("td");
        seatsCell.textContent = airplane.seats;
        row.appendChild(seatsCell);
        let manufacturerCell = document.createElement("td");
        manufacturerCell.textContent = airplane.manufacturer;
        row.appendChild(manufacturerCell);

        table.appendChild(row);
    });
  
    container.appendChild(table);
}

let form = document.querySelector(".addAirplanesForm");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let formData = {plane_ID: form.plane_ID.value, seats: form.seats.value, manufacturer: form.manufacturer.value};

    let res = await fetch("/addAirplanes", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(formData)
    });

    res = await res.json();

    let msg = form.querySelector(".message strong");
    if(res.error) {
    msg.textContent = res.error;
    } else {
    msg.textContent = "Airplane added successfully.";
    }
    fetchAirplanes();
});



fetchAirplanes();