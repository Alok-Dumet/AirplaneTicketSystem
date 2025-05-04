let popUpForm = document.querySelector(".popUpForm");
let popUp = document.querySelector(".popUp");

//on cancel hide the popup
document.querySelector(".cancel").addEventListener("click", () => {
    popUp.classList.add("hidden");
});

//on click of a row, show the customer comments and ratings
async function showDetails(event){
    let flight = event.currentTarget.flightData;
    popUp.classList.remove("hidden");

    //clear previous content
    let container = popUp.querySelector(".popUpContainer");
    container.textContent = "";

    //fetch flight ratings and comments
    let res = await fetch("/viewFlightRatingsComments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        flight_num: flight.flight_num,
        dep_date: flight.dep_date,
        dep_time: flight.dep_time,
        line_name: flight.line_name,
        })
    });
    res = await res.json();
    let customers = res.customers;

    //if theres no ratings say so
    if(customers.length === 0){
        let noTable = document.createElement("div")
        noTable.className = "noTable";
        noTable.textContent = "No flights found.";
        noTable.style = "color: black;"
        container.appendChild(noTable);
        return;
    }

    //creating the table and header row
    let table = document.createElement("table");
    let header = document.createElement("tr");

    //creating the headers
    ["First Name", "Last Name", "Rating", "Comment"].forEach(label => {
        let th = document.createElement("th");
        th.textContent = label;
        header.appendChild(th);
    });
    table.appendChild(header);

    //adding the rows
    customers.forEach(customer => {
        let row = document.createElement("tr");
        [customer.first_name, customer.last_name, customer.rating, customer.comment].forEach(val => {
        let td = document.createElement("td");
        td.textContent = val;
        row.appendChild(td);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
}

async function fetchRatings() {
    let container = document.querySelector(".resultsContainer");
    container.textContent = ""; // clear previous contents

    //fetching ratings
    let res = await fetch("/viewRatings", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    res = await res.json();
    let flights = res.flights;

    //If no flights found
    if (flights.length === 0) {
        let noTable = document.createElement("div")
        noTable.className = "noTable";
        noTable.textContent = "No flights found.";
        container.appendChild(noTable);
        return;
    }

    //creating the table and header row
    let table = document.createElement("table");
    let headerRow = document.createElement("tr");

    //creating the headers
    let headers = ["Flight #", "Departure Date", "Departure Time", "Airline", "Average Rating"];
    headers.forEach(header => {
        let th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //adding the rows
    flights.forEach(flight => {
        let row = document.createElement("tr");

        let rowData = [flight.flight_num, flight.dep_date.toString().split("T")[0], flight.dep_time, flight.line_name,
        flight.average_rating ?? "No Ratings" //in case no ratings. ? would give wrong result if rating is 0
        ];

        rowData.forEach(value => {
        let td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
        });

        table.appendChild(row);
        row.classList.add("changeable");

        row.flightData = {...flight, dep_date: flight.dep_date.toString().split("T")[0]};
        row.addEventListener("click", showDetails);
    });

    container.appendChild(table);
}

fetchRatings();