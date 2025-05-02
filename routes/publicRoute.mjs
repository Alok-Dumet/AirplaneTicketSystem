import express from 'express';
import { connection } from '../db.mjs';

const router = express.Router();

router.get('/publicInfo', (req, res) => {
  res.render('publicInfo', {error: null});
});

router.post('/publicInfo', (req, res) => {
  const {
    depArr,
    sourceCity,
    sourceName,
    destCity,
    destName,
    date
  } = req.body;

  //select all columns from flight, rename dep_airport and arr_airport attributes so I can select them easier
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
 
  //swap fields depending on if the user is wants to depart from here or arrive to here
  const srcCityField   = depArr === "Arrival" ? "arr_airport.city" : "dep_airport.city";
  const srcNameField   = depArr === "Arrival" ? "arr_airport.port_name" : "dep_airport.port_name";
  const destCityField  = depArr === "Arrival" ? "dep_airport.city" : "arr_airport.city";
  const destNameField  = depArr === "Arrival" ? "dep_airport.port_name" : "arr_airport.port_name";

  let conditions = [];
  let values = [];  

  //if the user provided these fields, I will use these fields in my where condition
  //A little messy I know
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
    conditions.push("Flight.dep_date = ?");
    values.push(date);
  }

  //If the user added no conditions, I will show them all the flights. Otherwise, I'm going to use whatever conditions they gave
  if(conditions.length !== 0){
    query += "WHERE " + conditions.join(" AND ")
  }

  console.log(query, values);

  connection.query(query, values, (err, results) => {
    console.log(results);
    res.json(results);
  });
});


export{
    router
}