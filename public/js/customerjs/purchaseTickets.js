let form = document.querySelector(".inputs")
let popUp = document.querySelector(".popUp");
let popUpForm = document.querySelector(".popUpForm");


//on cancel hide the popup
document.querySelector(".cancel").addEventListener("click", () => {
  popUp.classList.add("hidden");
});

//on click of a row, show the submission form and pass in the flight data to it
async function purchase(event){
  let flight = event.currentTarget.flightData;

  popUpForm.flight_num.value = flight.flight_num;
  popUpForm.dep_date.value = flight.dep_date;
  popUpForm.dep_time.value = flight.dep_time;
  popUpForm.line_name.value = flight.line_name;

  popUp.classList.remove("hidden");
}

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
      endDate: form.endDate.value
      };
    let res = await fetch("/searchFlights", {
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
          else{
            row.className = "changeable";
            row.addEventListener("click", purchase);
          }
  
          table.appendChild(row);
      });
  
      container.appendChild(table);
    }
  
}

form.addEventListener("submit", fetchFlightInfo);

//on submit purchase the ticket and display if it worked or not
popUpForm.addEventListener("submit", async (e) => {
  popUp.classList.add("hidden");
  e.preventDefault();

  let formData = {
    card_type: popUpForm.card_type.value,
    card_num: popUpForm.card_num.value,
    card_name: popUpForm.card_name.value,
    card_exp: popUpForm.card_exp.value,
    flight_num: popUpForm.flight_num.value,
    dep_date: popUpForm.dep_date.value,
    dep_time: popUpForm.dep_time.value,
    line_name: popUpForm.line_name.value
  };

  let res = await fetch("/purchaseTickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });

  res = await res.json();

  //Fade out message
  const message = document.createElement("div");
  if(!res.error){
    message.textContent = "Purchase Succesful";
  }else{
    message.textContent = res.error;
  }
  message.className = "completionMessage";
  document.body.appendChild(message);
  setTimeout(() => {
    message.remove();
  }, 3000);

  fetchFlightInfo();
});

fetchFlightInfo();