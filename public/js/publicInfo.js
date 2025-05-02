
const form = document.querySelector(".inputs")

form.addEventListener("submit", async (e) => {
  e.preventDefault();

    const data = {
    depArr: form.depArr.value,
    sourceCity: form.sourceCity.value,
    sourceName: form.sourceName.value,
    destCity: form.destCity.value,
    destName: form.destName.value,
    date: form.date.value
    };
  
  const res = await fetch("/publicInfo", {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
    });

    const results = await res.json();

    //clear previous table and fill in new data
    const container = document.querySelector(".resultsContainer");
    container.textContent = "";

    //If no tables were found
    if(results.length === 0) {
      let noTable = document.createElement("div")
      noTable.className = "noTable";
      noTable.textContent = "No flights found.";
      container.appendChild(noTable);
    }
    else {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");

    //Gets the attribute names
    Object.keys(results[0]).forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    //Gets each row
    results.forEach((flight) => {
        const row = document.createElement("tr");
        Object.values(flight).forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
    }

});