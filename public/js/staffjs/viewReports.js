let form = document.querySelector(".inputs");

//on submit fetch the tickets sold details based on range of dates
form.addEventListener("submit", async(event)=>{
  event.preventDefault();
  console.log("JavaScript form handler triggered");

  let data = {startDate: form.startDate.value, endDate: form.endDate.value};

  let res = await fetch("/viewReports", {
    method: "POST",
    headers: {"Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  res = await res.json();
  let ticketData = res.ticketData;

  //clear previous table and fill in new data
  let container = document.querySelector(".resultsContainer");
  container.textContent = "";

    //If no tables were found tell the user
  if (ticketData.length === 0) {
      let noTable = document.createElement("div")
      noTable.className = "noTable";
      noTable.textContent = "No tickets sold.";
      container.appendChild(noTable);
    return;
  }

  //Creating header row
  let table = document.createElement("table");
  let headerRow = document.createElement("tr");
  let headers = ["Year", "Month", "Tickets Sold"];

  //for every attribute, make a tableheader cell and add it to the first table row
  headers.forEach((header) => {
    let th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  //For each month and year combination, make a row and for every attribute, make a tableheader cell and add it to the row
  ticketData.forEach((month) => {
    let row = document.createElement("tr");

    let year = document.createElement("td");
    year.textContent = month.year;
    row.appendChild(year);

    let month_name = document.createElement("td");
    month_name.textContent = month.month_name;
    row.appendChild(month_name);

    let tickets = document.createElement("td");
    tickets.textContent = month.tickets_sold;
    row.appendChild(tickets);

    table.appendChild(row);
  });

  container.appendChild(table);
});