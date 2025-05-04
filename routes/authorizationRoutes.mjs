import express from 'express';
import bcrypt from 'bcrypt';
import { connection } from '../db.mjs';

const router = express.Router();

//routes that users can access without being logged in
const publicRoutes = [
  /^\/customerLogin$/, 
  /^\/customerRegister$/, 
  /^\/staffLogin$/, 
  /^\/staffRegister$/,
  /^\/publicInfo$/
];

//staff only allowed routes
const staffOnlyRoutes = [
  /^\/viewFlights$/,
  /^\/addFlights$/,
  /^\/changeStatus$/,
  /^\/viewAirplanes$/,
  /^\/addAirplanes$/,
  /^\/viewAirports$/,
  /^\/addAirports$/,
  /^\/viewFlightRatingsComments$/,
  /^\/viewRatings$/,
  /^\/viewReports$/
];

//If the user attempts to reach a protected route while not logged in, redirect to login page
export default function isAuthenticated(req, res, next) {
  let isPublic = publicRoutes.some((pattern) => pattern.test(req.path));
  let isStaffOnly = staffOnlyRoutes.some((pattern) => pattern.test(req.path));

  if(!isPublic) {

    if(!req.session.email && !req.session.username) {
      return res.redirect("/customerLogin");
    }

    if(req.session.email && isStaffOnly){
      return res.redirect("/customerHome");
    }

  }

  next();
}

//Render customer register page
router.get('/customerRegister', (req, res) => {
  res.render('customerRegister', {error: null });
});

//Check for valid customer registration
router.post('/customerRegister', (req, res) => {
  let {
    email, first_name, last_name, password,
    building_num, street, city, state,
    phone_num, passport_num, passport_exp,
    passport_country, date_of_birth
  } = req.body;

  //Selects all customers with email same as the users registered email
  connection.query('SELECT * FROM airplaneSystem.customer WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      res.render('customerRegister', { error: 'User already exists' });
    }
    else{

      let hashedPassword = await bcrypt.hash(password, 10);
      
      let values = [
        email, first_name, last_name, hashedPassword,
        building_num, street, city, state,
        phone_num, passport_num, passport_exp,
        passport_country, date_of_birth
      ];

      let query = "INSERT INTO airplaneSystem.customer (email, first_name, last_name, password, building_num, street, city, state, phone_num, passport_num, passport_exp, passport_country, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        connection.query(query, values, (err, result) => {
          if(err){
            res.render('customerRegister', { error: err.message });
          }
            req.session.email = email;
            req.session.first_name = first_name;
            req.session.last_name = last_name;
            req.session.building_num = building_num;
            req.session.street = street;
            req.session.city = city;
            req.session.state = state;
            req.session.phone_num = phone_num;
            req.session.passport_num = passport_num;
            req.session.passport_exp = passport_exp;
            req.session.passport_country = passport_country;
            req.session.date_of_birth = date_of_birth;
            res.redirect('/customerHome');
          });
    }
  });
});

//Render customer login page
router.get('/customerLogin', (req, res) => {
  res.render('customerLogin', { error: null });
});

//Check for valid customer login
router.post('/customerLogin', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
  connection.query('SELECT * FROM airplaneSystem.customer WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      let found = await bcrypt.compare(password, results[0].password);

      if(found){
        req.session.email = results[0].email;
        req.session.first_name = results[0].first_name;
        req.session.last_name = results[0].last_name;
        req.session.building_num = results[0].building_num;
        req.session.street = results[0].street;
        req.session.city = results[0].city;
        req.session.state = results[0].state;
        req.session.phone_num = results[0].phone_num;
        req.session.passport_num = results[0].passport_num;
        req.session.passport_exp = results[0].passport_exp;
        req.session.passport_country = results[0].passport_country;
        req.session.date_of_birth = results[0].date_of_birth;
        res.redirect('/customerHome');
      }
      else{
        res.render('customerLogin', { error: 'Invalid credentials' });
      }
    } else {
      res.render('customerLogin', { error: 'Invalid credentials' });
    }
  });
});

//Render staff register page
router.get('/staffRegister', (req, res) => {
  res.render('staffRegister', {error: null });
});

//Check for valid staff registration
router.post('/staffRegister', (req, res) => {
  let {username, password, first_name, last_name, date_of_birth, line_name} = req.body;

  //Selects all staff with email same as the users registered email
  connection.query('SELECT * FROM airplaneSystem.airline_staff WHERE username = ?', [username], async (err, results) => {
    if (results.length > 0) {
      res.render('staffRegister', { error: 'Staff already exists' });
    }
    else{
      connection.query('SELECT * FROM airplaneSystem.airline WHERE line_name = ?', [line_name], async (err, results) => {
        if (results.length < 1) {
          res.render('staffRegister', { error: 'Airline does not exist' });
        }
        else{
    
          let hashedPassword = await bcrypt.hash(password, 10);
          
          let values = [username, hashedPassword, first_name, last_name, date_of_birth, line_name];
    
          let query = "INSERT INTO airplaneSystem.airline_staff (username, password, first_name, last_name, date_of_birth, line_name) VALUES (?, ?, ?, ?, ?, ?)"
            connection.query(query, values, (err, result) => {
              if(err){
                res.render('staffRegister', { error: err.message });
              }
              req.session.username = username;
              req.session.first_name = first_name;
              req.session.last_name = last_name;
              req.session.date_of_birth = date_of_birth;
              req.session.line_name = line_name;
                res.redirect('/staffHome');
              });
        }
      });
    }
  });
});

//Render staff login page
router.get('/staffLogin', (req, res) => {
  res.render('staffLogin', { error: null });
});

//Check for valid staff login
router.post('/staffLogin', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
  connection.query('SELECT * FROM airplaneSystem.airline_staff WHERE username = ?', [username], async (err, results) => {
    if (results.length > 0) {
      let found = await bcrypt.compare(password, results[0].password);

      if(found){
        req.session.username = results[0].username;
        req.session.first_name = results[0].first_name;
        req.session.last_name = results[0].last_name;
        req.session.date_of_birth = results[0].date_of_birth;
        req.session.line_name = results[0].line_name;
        res.redirect('/staffHome');
      }
      else{
        res.render('staffLogin', { error: 'Invalid credentials' });
      }
    } else {
      res.render('staffLogin', { error: 'Invalid credentials' });
    }
  });
});


export{
    router
}