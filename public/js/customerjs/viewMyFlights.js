let form = document.querySelector(".inputs")

async function fetchFlightInfo(e){
    //after posting your filters, don't reload the page
    if(e){
      e.preventDefault();
    }

    //collect the data and make a background request to retreive flight data
    let data = {
      depArr: form.depArr.value,
      sourceCity: form.sourceCity.value,
      sourceName: form.sourceName.value,
      destCity: form.destCity.value,
      destName: form.destName.value,
      startDate: form.startDate.value,
      endDate: form.endDate.value
      };
    let res = await fetch("/viewMyFlights", {
      method: "POST",
      headers: {
      "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
      });
    res = await res.json();
    let flights = res.flights;
  
    //clear previous table and fill in new data
    let container = document.querySelector(".resultsContainer");
    container.textContent = "";
  
    //If no tables were found tell the user
    if(flights.length === 0) {
      let noTable = document.createElement("div")
      noTable.className = "noTable";
      noTable.textContent = "No flights found.";
      container.appendChild(noTable);
    }
    else
    {
      let table = document.createElement("table");
      let headerRow = document.createElement("tr");
  
      //Header row
      let header = ["Flight #", "Departure Date", "Departure Time", "Airline",
        "Arrival Date", "Arrival Time", "Base Price", "Status", "Departure Port", "Arrival Port",
        "Airplane Airline", "Plane ID", "Departure City", "Departure Port Name", "Arrival City", "Arrival Port Name"]
      //for every attribute, make a tableheader cell and add it to the first table row
      header.forEach((attribute) => {
          let th = document.createElement("th");
          th.textContent = attribute;
          headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
  
      //For each flight, make a row and for every attribute, make a tableheader cell and add it to the row
      flights.forEach((flight) => {
          let row = document.createElement("tr");
          Object.values(flight).forEach((value) => {
          let td = document.createElement("td");
          td.textContent = value;
          row.appendChild(td);
          });
  
          //Each row will store its flight data (for later use)
          row.flightData = flight;
          if(flight.status === "Cancelled"){
            row.className = "cancelled";
          }
  
          table.appendChild(row);
      });
  
      container.appendChild(table);
    }
  
}

form.addEventListener("submit", fetchFlightInfo);


fetchFlightInfo();