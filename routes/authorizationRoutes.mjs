import express from 'express';
import bcrypt from 'bcrypt';
import { connection } from '../db.mjs';

const router = express.Router();

//routes that users shouldn't be able to access unless logged in
const protectedRoutes = ["/"];

//If the user attempts to reach a protected route while not logged in, redirect to login page
export default function isAuthenticated(req, res, next){
  if(protectedRoutes.includes(req.path)){
    if(req.session.username || req.session.email){
      console.log(req.session.username, req.session.email);
      next();
    }
    else{
      res.redirect("/customerLogin");
    }
  }
  else{
    next();
  }
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
            res.redirect('/');
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
    console.log("accessing database")
  connection.query('SELECT * FROM airplaneSystem.customer WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      console.log("comparing with hash");
      let found = await bcrypt.compare(password, results[0].password);

      if(found){
        console.log("found")
        req.session.email = email;
        res.redirect('/');
      }
      else{
        console.log("wrong password")
        res.render('customerLogin', { error: 'Invalid credentials' });
      }
    } else {
      console.log("user not found")
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
                res.redirect('/');
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
    console.log("accessing database")
  connection.query('SELECT * FROM airplaneSystem.airline_staff WHERE username = ?', [username], async (err, results) => {
    if (results.length > 0) {
      console.log("comparing with hash");
      let found = await bcrypt.compare(password, results[0].password);

      if(found){
        console.log("found")
        req.session.username = username;
        res.redirect('/');
      }
      else{
        console.log("wrong password")
        res.render('staffLogin', { error: 'Invalid credentials' });
      }
    } else {
      console.log("user not found")
      res.render('staffLogin', { error: 'Invalid credentials' });
    }
  });
});


export{
    router
}