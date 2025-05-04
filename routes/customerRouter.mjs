import express from "express";
import { connection } from "../db.mjs";

let router = express.Router();

//shows all flights that belong to a particular customer
router.get("/viewMyFlights", (req, res)=>{
  res.render("customerPages/viewMyFlights");
});
router.post("/viewMyFlights", (req, res)=>{
  //retrieve posted filter data
  let{depArr, sourceCity, sourceName, destCity, destName, startDate, endDate} = req.body;
  let email = req.session.email;


  //select all columns from flight joined with airport twice for dep and arr port
  let query =
  `SELECT
    Flight.*,
    dep_airport.city AS dep_city,
    dep_airport.port_name AS dep_name,
    arr_airport.city AS arr_city,
    arr_airport.port_name AS arr_name
  FROM Ticket
  JOIN Flight ON Ticket.flight_num = Flight.flight_num 
    AND Ticket.dep_date = Flight.dep_date 
    AND Ticket.dep_time = Flight.dep_time 
    AND Ticket.line_name = Flight.line_name
  JOIN Airport AS dep_airport ON Flight.dep_port = dep_airport.port_code
  JOIN Airport AS arr_airport ON Flight.arr_port = arr_airport.port_code
  WHERE Ticket.email = ?`;

  //will hold the where clauses for conditions
  let conditions = [];

  //will hold the values the user wants to use in the where clause
  let values = [email];
 
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

  //If the user added no conditions, I will show them all the flights. Otherwise, I"m going to use whatever conditions they gave
  if(conditions.length !== 0){
    query += " AND " + conditions.join(" AND ");
  }

  //Lastly, Order by earliest date to latest date
  query += " ORDER BY dep_date ASC";

  //query for flights
  connection.query(query, values, async (err, results) => {
    results.forEach(flight => {
      flight.dep_date = flight.dep_date.toISOString().split("T")[0];
      flight.arr_date = flight.arr_date.toISOString().split("T")[0];
    });

    res.json({flights: results});
  });
});

//shows all future flights for a customer
router.get("/searchFlights", (req, res)=>{
  res.render("customerPages/searchFlights");
});
router.post("/searchFlights", (req, res)=>{
  //retrieve posted filter data
  let{depArr, sourceCity, sourceName, destCity, destName, endDate} = req.body;

  //select all columns from flight joined with airport twice for dep and arr port
  let query = `
    SELECT
      Flight.*,
      dep_airport.city AS dep_city,
      dep_airport.port_name AS dep_name,
      arr_airport.city AS arr_city,
      arr_airport.port_name AS arr_name
    FROM Flight
    JOIN Airport AS dep_airport ON Flight.dep_port = dep_airport.port_code
    JOIN Airport AS arr_airport ON Flight.arr_port = arr_airport.port_code`;

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

  let today = new Date().toISOString().split("T")[0];
  conditions.push("Flight.dep_date >= ?");
  values.push(today);

  if(endDate) {
    conditions.push("Flight.dep_date <= ?");
    values.push(endDate);
  }

  //If the user added no conditions, I will show them all the flights. Otherwise, I"m going to use whatever conditions they gave
  if(conditions.length !== 0){
    query += " WHERE " + conditions.join(" AND ");
  }

  //Lastly, Order by earliest date to latest date
  query += " ORDER BY dep_date ASC";

  //query for flights
  connection.query(query, values, (err, results) => {
    results.forEach(flight => {
      flight.dep_date = flight.dep_date.toISOString().split("T")[0];
      flight.arr_date = flight.arr_date.toISOString().split("T")[0];
    });

    res.json({flights: results});
  });
});

//lets a customer purchase tickets
router.get("/purchaseTickets", (req, res)=>{
  res.render("customerPages/purchaseTickets");
});
router.post("/purchaseTickets", (req, res)=>{
  let {card_type, card_num, card_name, card_exp, flight_num, dep_date, dep_time, line_name } = req.body;
  let email = req.session.email;
  let values = [flight_num, dep_date, dep_time, line_name];

  let query = `
    SELECT Airplane.seats FROM Flight 
    JoIN Airplane ON Flight.plane_ID = Airplane.plane_ID
    AND Flight.airplane_line_name = Airplane.line_name
    WHERE Flight.flight_num = ?
    AND Flight.dep_date = ?
    AND Flight.dep_time = ?
    AND Flight.line_name = ?;
  `;

  //query to see if the flight exists at all
  connection.query(query, values, (err, results) => {
    if(err){
      console.error("SQL error:", err);
      return res.json({ error: "Do NOT try to mess with the URL" });
    }

    if(results.length === 0) {
      return res.json({ error: "Sorry. No Such Flight Exists" });
    }

    let seats = results[0].seats;

    let query = `
      SELECT COUNT(*) AS ticket_count FROM Ticket
      WHERE flight_num = ?
      AND dep_date = ?
      AND dep_time = ?
      AND line_name = ?;
    `;

    //query for how many tickets are left
    connection.query(query, values, (err, results) => {
      if(err){
        console.error("SQL error:", err);
        return res.json({ error: "Don't mess with the URL!!!" });
      }

      let tickets = results[0].ticket_count;

      if(tickets >= seats){
        return res.json({ error: "Sorry. All Tickets have been purchased." });
      }

      //checks if the flight is in the future
      const today = new Date();
      const depDate = new Date(dep_date);
      if(depDate <= today){
        return res.json({ error: "Flight departure date must be in the future." });
      }

      //checks if the credit card expired
      const cardExp = new Date(card_exp);
      if(cardExp <= today) {
        return res.json({ error: "Credit card is expired" });
      }

      //check if passport expires less than 6 months after departure
      const passportExp = new Date(req.session.passport_exp);
      const safePeriod = new Date(depDate);
      safePeriod.setMonth(safePeriod.getMonth() + 6);

      if(passportExp <= safePeriod){
        return res.json({ error: "Passport must be valid for at least 6 months after the departure date." });
      }

      //generating a unique ID
      let ticketID = "T" + Date.now();
      values = [ticketID, email, flight_num, dep_date, dep_time, line_name];

      //insert new ticket into the ticket table
      query = `
      INSERT INTO Ticket (ticket_ID, email, flight_num, dep_date, dep_time, line_name)
      VALUES (?, ?, ?, ?, ?, ?); `;
      connection.query(query, values, (err) => {

          //inserting new purchased value into purchased table
          let purchaseDate = new Date();
          let purchase_date = purchaseDate.toISOString().split("T")[0];
          let purchase_time = purchaseDate.toTimeString().split(" ")[0];
          values = [ticketID, email, card_type, card_num, card_name, card_exp, purchase_date, purchase_time];

          query = `INSERT INTO Purchased (ticket_ID, email, card_type, card_num, card_name, card_exp, purchase_date, purchase_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;

          //inserting new purchased value into purchased table
          connection.query(query, values, (err) => {
              return res.json({});
          });

      });
    });
  });

})

//lets a customer cancel a ticket
router.get("/cancelTrip", (req, res)=>{
  res.render("customerPages/cancelTrip");
});
router.post("/cancelTrip", (req, res)=>{
  let {flight_num, dep_date, dep_time, line_name} = req.body;
  let email = req.session.email;

  let query = `SELECT Ticket.ticket_ID, Flight.status
               FROM Ticket
               JOIN Flight ON
                 Ticket.flight_num = Flight.flight_num AND
                 Ticket.dep_date = Flight.dep_date AND
                 Ticket.dep_time = Flight.dep_time AND
                 Ticket.line_name = Flight.line_name
               WHERE Ticket.flight_num = ? AND Ticket.dep_date = ? AND Ticket.dep_time = ? AND Ticket.line_name = ? AND Ticket.email = ?`;

  let values = [flight_num, dep_date, dep_time, line_name, email];

  //query for all tickets that belong to the user and the matching flight
  connection.query(query, values, (err, results) => {
    if(!results || results.length === 0){
      return res.json({ error: "Do not mess with the URL"});
    }

    let { ticket_ID, status } = results[0];

    //user can't cancel within 24 hours of the dep_date or after it
    let depDate = new Date(`${dep_date}T${dep_time}`);
    let now = new Date();
    let cutoff = new Date(now.getTime() + (24 * 60 * 60 * 1000));

    //if the flight was cancelled, the customer may cancel their ticket regardless of time
    if( !(status === "Cancelled" || depDate > cutoff)){
      return res.json({ error: "Cannot cancel within 24 hours of departure or after." });
    }

    //delete from Purchased first
    query = "DELETE FROM Purchased WHERE ticket_ID = ?";
    connection.query(query, [ticket_ID], (err) => {
      
      //delete from Ticket
      query = "DELETE FROM Ticket WHERE ticket_ID = ?";
      connection.query(query, [ticket_ID], (err) => {
        return res.json({ message: "Ticket successfully canceled.", ticket_ID });
      });
    });
  });
});

//gets all flights a user has taken in the past specifically
router.get("/taken", (req, res)=>{
  let email = req.session.email;

  let query = `
    SELECT Flight.*
    FROM Ticket
    JOIN Flight ON 
      Ticket.flight_num = Flight.flight_num AND 
      Ticket.dep_date = Flight.dep_date AND 
      Ticket.dep_time = Flight.dep_time AND 
      Ticket.line_name = Flight.line_name
    WHERE Ticket.email = ?
  `;

  connection.query(query, [email], (err, results)=>{
    let now = new Date();

    //check which of these flights the user has taken in the past, not WILL take
    let pastFlights = results.filter((flight) => {
      let depDateTime = new Date(`${flight.dep_date.toISOString().split("T")[0]}T${flight.dep_time}`);
      return depDateTime <= now;
    });

    //format the dates into a more readable format
    pastFlights.forEach(flight => {
      flight.dep_date = flight.dep_date.toISOString().split("T")[0];
      flight.arr_date = flight.arr_date.toISOString().split("T")[0];
    });

    res.json({ flights: pastFlights });
  });
});

//lets the customer post 1 rating for a flight they took in the past
router.get("/ratingsComments", (req, res)=>{
  res.render("customerPages/ratingsComments");
});
router.post("/ratingsComments", (req, res)=>{
  let {flight_num, dep_date, dep_time, line_name, rating, comment} = req.body;
  let email = req.session.email;

  if(!comment){
    comment = "No Comment";
  }


  //checks just in case someone tried to send fake data
  rating = parseInt(rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return res.json({ error: "Do not mess with the submission form" });
  }

  //checks just in case someone tried to send fake data
  let depDate = new Date(`${dep_date}T${dep_time}`);
  let now = new Date();
  if(now <= depDate){
    return res.json({ error: "Don't mess with the submission form" });
  }

  //check if the user already rated the flight
  let query = "SELECT rating, comment FROM Taken WHERE flight_num = ? AND dep_date = ? AND dep_time = ? AND line_name = ? AND email = ?";
  let values = [flight_num, dep_date, dep_time, line_name, email];
  connection.query(query, values, (err, results) => {

    //If the user already rated the flight
    if(results.length > 0){
      return res.json({ error: "You already rated this trip." });
    }

    //insert the rating and comment into the taken table
    query = "INSERT INTO Taken (flight_num, dep_date, dep_time, line_name, email, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)";
    values = [flight_num, dep_date, dep_time, line_name, email, rating, comment];

    connection.query(query, values, (err) => {
      res.json({ message: "Rating submitted successfully." });
    });
  });
});

export{
    router
}