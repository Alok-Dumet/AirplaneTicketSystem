import express from "express";
import { connection } from "../db.mjs";

let router = express.Router();

//The get and post show flight data with customers to the staff
router.get("/viewFlights", (req, res) => {
  res.render("staffPages/viewFlights");
});
router.post("/viewFlights", (req, res) => {

  //retrieve posted filter data
  let{depArr, sourceCity, sourceName, destCity, destName, startDate, endDate} = req.body;

  //select all columns from flight joined with airport twice for dep and arr port
  let query =
  `SELECT
    Flight.*,
    dep_airport.city AS dep_city,
    dep_airport.port_name AS dep_name,
    arr_airport.city AS arr_city,
    arr_airport.port_name AS arr_name
  FROM Flight
  JOIN Airport AS dep_airport ON Flight.dep_port = dep_airport.port_code
  JOIN Airport AS arr_airport ON Flight.arr_port = arr_airport.port_code
  `;

  //will hold the where clauses for conditions
  let conditions = [];

  //will hold the values the user wants to use in the where clause
  let values = [];
 
  //swap fields depending on if the user is wants to depart from or arrive from a location
  let srcCityField   = depArr === "Arrival" ? "arr_airport.city" : "dep_airport.city";
  let srcNameField   = depArr === "Arrival" ? "arr_airport.port_name" : "dep_airport.port_name";
  let destCityField  = depArr === "Arrival" ? "dep_airport.city" : "arr_airport.city";
  let destNameField  = depArr === "Arrival" ? "dep_airport.port_name" : "arr_airport.port_name"; 

  //If the user provides any of the following fields, add them to the conditions and values list to make where clauses with
  if(sourceCity) {
    conditions.push(`${srcCityField} = ?`);
    values.push(sourceCity);
  }
  if(sourceName) {
    conditions.push(`${srcNameField} = ?`);
    values.push(sourceName);
  }
  if(destCity) {
    conditions.push(`${destCityField} = ?`);
    values.push(destCity);
  }
  if(destName) {
    conditions.push(`${destNameField} = ?`);
    values.push(destName);
  }
  if(startDate) {
    conditions.push("Flight.dep_date >= ?");
    values.push(startDate);
  }
  if(endDate) {
    conditions.push("Flight.dep_date <= ?");
    values.push(endDate);
  }
  //Flights must be the same as the staffs
  conditions.push("Flight.line_name = ?");
  values.push(req.session.line_name);

  //If the user added no conditions, I will show them all the flights. Otherwise, I"m going to use whatever conditions they gave
  if(conditions.length !== 0){
    query += "WHERE " + conditions.join(" AND ")
  }

  //Lastly, Order by earliest date to latest date
  query += " ORDER BY dep_date ASC";

  //query for flights
  connection.query(query, values, async (err, results) => {
    results.forEach((flight) => {
      //return the dates in a readable format, becuase some weird format is returned normally
      flight.arr_date = flight.arr_date.toISOString().split("T")[0];
      flight.dep_date = flight.dep_date.toISOString().split("T")[0];
    });

    //querying for all customer names that bought tickets for a specific flight
    query = `
      SELECT Customer.first_name, Customer.last_name
      FROM Ticket
      JOIN Customer ON Customer.email = Ticket.email
      WHERE Ticket.flight_num = ? AND Ticket.dep_date = ? AND Ticket.dep_time = ? AND Ticket.line_name = ?
    `;

    //for each flight, run the query to find all customers that bought tickets for them
    let flightsAndCustomers = await Promise.all(
      results.map(async function(flight){
        return new Promise((resolve, reject) => {
          connection.query(query, [flight.flight_num, flight.dep_date, flight.dep_time, flight.line_name], (err, results)=>{

            //Return an array of customers full name
            let customers = results.map(elem => `${elem.first_name} ${elem.last_name}`).join(", ");
            flight.customers = customers;
            resolve(flight);
          });
        });
      })
    );
    res.json({flights: flightsAndCustomers});
  });
});

//the get and post show flight data and allows you to add flights
router.get("/addFlights", (req, res) => {
    res.render("staffPages/addFlights");
});
router.post("/addFlights", (req, res) => {
  //retrieve posted new flight data
  let { flight_num, dep_date, dep_time, arr_date, arr_time, base_price, status, dep_port, arr_port, plane_ID} = req.body;
  let line_name = req.session.line_name;
  let query  =`
    INSERT INTO Flight (flight_num, dep_date, dep_time, line_name,
    arr_date, arr_time, base_price, status,
    dep_port, arr_port, airplane_line_name, plane_ID
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  //should be an appropriate status
  let allowedStatuses = ["delayed", "on-time", "cancelled"];
  if(!allowedStatuses.includes(status.toLowerCase())){
    return res.json({ error: "Status must be 'Delayed', 'On-Time', or 'Cancelled'." });
  }

  //Formatting for good looks
  status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if(status === "On-time"){
    status = "On-Time";
  }

  let values =[flight_num, dep_date, dep_time, line_name, arr_date, arr_time, base_price, status, dep_port, arr_port, line_name, plane_ID];

  //insertion query for a new flight
  connection.query(query, values, (err, result)=>{
    if(err){
      //check if the flight was already used
      if(err.code === 'ER_DUP_ENTRY'){
        return res.json({ message: "A flight with this flight number, date, time, and airline already exists"});
      }
  
      //check if a foreign key was violated
      if(err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW'){
        const message = err.message;
  
        if (message.includes('dep_port')) {
          return res.json({ message: "Departure Port doesn't match any existing airports" });
        }
        if (message.includes('arr_port')) {
          return res.json({ message: "Arrival Port doesn't match any existing airports" });
        }
        if (message.includes('plane_ID')) {
          return res.json({ message: "Plane ID doesn't match any existing planes" });
        }
      }
  
      //just in case
      return res.json({ message: "Database error: " + err.message });
    }
  
    //relay success to frontend
    res.json({message: "Flight added successfully." });
  });
});

//the get and post show flight data and allow you to change flight status
router.get("/changeStatus", (req, res) => {
    res.render("staffPages/changeStatus");
});
router.post("/changeStatus", (req, res) => {
  let {flight_num, dep_date, dep_time, status} = req.body;
  let line_name = req.session.line_name;

  //should be an appropriate status
  let allowedStatuses = ["delayed", "on-time", "cancelled"];
  if(!allowedStatuses.includes(status.toLowerCase())){
    return res.json({ error: "Status must be 'Delayed', 'On-Time', or 'Cancelled'." });
  }

  //Formatting for good looks
  status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if(status === "On-time"){
    status = "On-Time";
  }

  let query = "UPDATE Flight SET status = ? WHERE flight_num = ? AND dep_date = ? AND dep_time = ? AND line_name = ?";
  let values = [status, flight_num, dep_date, dep_time, line_name];

  connection.query(query, values, (err, result) => {
    res.json({});
  });
});

//retrieve airplanes
router.get("/viewAirplanes", (req, res)=>{
  let line_name = req.session.line_name;

  let query = "SELECT plane_ID, seats, manufacturer FROM Airplane WHERE line_name = ?";

  connection.query(query, [line_name], (err, results) => {
    res.json({ airplanes: results });
  });
});

//the get and post show airplane data and allow you to add airplanes
router.get("/addAirplanes", (req, res) => {
    res.render("staffPages/addAirplanes");
});
router.post("/addAirplanes", (req, res) => {
  let {plane_ID, seats, manufacturer } = req.body;
  let line_name = req.session.line_name;

  let query = "INSERT INTO Airplane (line_name, plane_ID, seats, manufacturer) VALUES (?, ?, ?, ?)";
  let values = [line_name, plane_ID, seats, manufacturer];

  connection.query(query, values, (err, results) => {
    if(err){
      if(err.code === "ER_DUP_ENTRY") {
        return res.json({ error: "This plane already exists." });
      }
    }

    res.json({});
  });
});

//retrieve airports
router.get("/viewAirports", (req, res)=>{
  let query = "SELECT port_code, port_name, city, country FROM Airport";

  connection.query(query, (err, results) => {
    res.json({ airports: results });
  });
})

//the get and post show airport data and allow you to add airports
router.get("/addAirports", (req, res) => {
    res.render("staffPages/addAirports");
});
router.post("/addAirports", (req, res) => {
  let {port_code, port_name, city, country} = req.body;
  let query = "INSERT INTO Airport (port_code, port_name, city, country) VALUES (?, ?, ?, ?)";
  let values = [port_code, port_name, city, country];

  connection.query(query, values, (err, results) => {
    if(err){
      if(err.code === "ER_DUP_ENTRY") {
        return res.json({ error: "This port already exists." });
      }
    }
    res.json({});
  });
});
//retrieves the ratings and comments of each customer that took a specific flight
router.post("/viewFlightRatingsComments", (req, res)=>{
  let {flight_num, dep_date, dep_time, line_name } = req.body;

  let query = `
    SELECT Customer.first_name, Customer.last_name, Taken.rating, Taken.comment
    FROM Taken
    JOIN Customer ON Taken.email = Customer.email
    WHERE Taken.flight_num = ? AND Taken.dep_date = ? AND Taken.dep_time = ? AND Taken.line_name = ?
  `;

  let values = [flight_num, dep_date, dep_time, line_name];

  connection.query(query, values, (err, results) => {
    res.json({ customers: results });
  });
})

//the get and post shows and retrieves the average ratings of a flight rounded so I don't get a weird table
router.get("/viewRatings", (req, res) => {
    res.render("staffPages/viewRatings");
});
router.post("/viewRatings", (req, res) => {
  let line_name = req.session.line_name;

  const query = `
    SELECT 
      F.flight_num, 
      F.dep_date, 
      F.dep_time,
      F.line_name,
      ROUND(AVG(T.rating), 2) AS average_rating
    FROM Flight F
    LEFT JOIN Taken T 
      ON F.flight_num = T.flight_num 
      AND F.dep_date = T.dep_date 
      AND F.dep_time = T.dep_time 
      AND F.line_name = T.line_name
    WHERE F.line_name = ?
    GROUP BY F.flight_num, F.dep_date, F.dep_time, F.line_name
    ORDER BY F.dep_date ASC, F.dep_time ASC;
  `;

  connection.query(query, [line_name], (err, results) => {
    res.json({ flights: results });
  });
});

//the get and post shows and retrieves the tickets sold each month of each year organized by month
router.get("/viewReports", (req, res) => {
    res.render("staffPages/viewReports");
});
router.post("/viewReports", (req, res) => {
  let { startDate, endDate } = req.body;
  let line_name = req.session.line_name;

  //querying purchased tickets for the flights of the same line as the staff
  //converting the purchase date into words to make table look better
  //I need both month and month name because of stupid ONLY_FULL_GROUP_BY mode
  let query = `
  SELECT 
    YEAR(purchase_date) AS year,
    MONTH(purchase_date) AS month_number,
    MONTHNAME(purchase_date) AS month_name,
    COUNT(*) AS tickets_sold
  FROM Purchased
  JOIN Ticket ON Purchased.ticket_ID = Ticket.ticket_ID
  WHERE Ticket.line_name = ?`;
  
  //check if the user provided values or not
  let values = [line_name];
  if(startDate){
    query += " AND purchase_date >= ?";
    values.push(startDate);
  }
  if(endDate){
    query += " AND purchase_date <= ?";
    values.push(endDate);
  }

  //group by the year and month
  query += " GROUP BY year, month_number, month_name ORDER BY year ASC, month_number ASC";

  connection.query(query, values, (err, results) => {
    res.json({ ticketData: results });
  });
});

export{
    router
}