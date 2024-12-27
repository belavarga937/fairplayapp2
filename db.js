const { urlencoded } = require('body-parser');
const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { genSalt } = require('bcryptjs');
require('dotenv').config();

const conncetDB = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {console.log("Verbindung zur DB ist erfolgreich");})
    .catch((err) => {console.error(err);})
};

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

//Passwörter beim Erstellen hashen
const hashingPasswords = async (newPassword) => {
    try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            console.log("Passwort wurde gehasht: " + hash);
            return hash;
        }
    catch (err){
        console.error(err);
        throw err;
    }
};

//Passwörter vergleichen
const comparePasswords = async (userInputPassword, storedHashPassword) => {
    try {
        const result = await bcrypt.compare(userInputPassword, storedHashPassword);
        if (result) { console.log("Passwords matched");}
        else {
            console.log("Passwörter stimmen nicht überein");
        }
        return result;
    }
    catch (err) {
        if (err) {console.error(err);}
        throw err;
    }
};

const User = mongoose.model('User', userSchema);

//Nutzer erstellen
const createNewUser = async () => {
    try {
        const password = await hashingPasswords("admin");
        const newUser = await new User({name: "admin", password: password});
        await newUser.save();
        console.log("Benutzer erdolgreich gespeichert");
    }
    catch (error) {
        console.error(error);
    }
};




//Passwort hashen
/*const saltRounds = 10;

bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
        return console.error(err);
    }

});

bcrypt.hash(userPassword, (err, hash) => {
    if (err) {
        return console.error(err);
    }
    console.log('Hashed Password: ' + hash);
});
*/





module.exports = {
    conncetDB,
    User,
    createNewUser,
    comparePasswords
};