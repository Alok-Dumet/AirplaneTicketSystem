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

//Render register page
router.get('/customerRegister', (req, res) => {
  res.render('customerRegister', { error: null });
});

//Check for valid registration
router.post('/customerRegister', (req, res) => {
  let email = req.body.email;
    
  connection.query('SELECT * FROM airplaneSystem.customer WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      res.render('customerRegister', { error: 'User already exists' });
    }
    else{
      let {
        email, first_name, last_name, password,
        building_num, street, city, state,
        phone_num, passport_num, passport_exp,
        passport_country, date_of_birth
      } = req.body;

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

//Render login page
router.get('/customerLogin', (req, res) => {
  res.render('customerLogin', { error: null });
});

//Check for valid login
router.post('/customerLogin', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    console.log("accessing database")
  connection.query('SELECT * FROM airplaneSystem.customer WHERE email = ?', [email], async (err, results) => {
    if(err){
      return res.render('customerLogin', { error: err.message });
    }
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

export{
    router
}