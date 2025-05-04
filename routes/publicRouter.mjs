import express from "express";
import { connection } from "../db.mjs";

let router = express.Router();

//get public information about flights
router.get("/publicInfo", (req, res) => {
  res.render("publicInfo");
});

//post filters to get specific information about flights
router.post("/publicInfo", (req, res) => {

  //retrieve posted filter data
  let {
    depArr,
    sourceCity,
    sourceName,
    destCity,
    destName,
    date,
  } = req.body;

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
  if(date) {
    conditions.push("Flight.dep_date >= ?");
    values.push(date);
  }

  //If the user added no conditions, I will show them all the flights. Otherwise, I"m going to use whatever conditions they gave
  if(conditions.length !== 0){
    query += "WHERE " + conditions.join(" AND ")
  }

  //Lastly, Order by earliest date to latest date
  query += " ORDER BY dep_date ASC";

  //query for flights
  connection.query(query, values, (err, results) => {
    results.forEach((flight) => {
      //return the dates in a readable format, becuase some weird format is returned normally
      flight.arr_date = flight.arr_date.toISOString().split("T")[0];
      flight.dep_date = flight.dep_date.toISOString().split("T")[0];
    });
    res.json({flights: results});
  });
});


export{
    router
}