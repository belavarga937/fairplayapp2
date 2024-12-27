const { urlencoded } = require('body-parser');
const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');
require('dotenv').config();
const {conncetDB, User, createNewUser, comparePasswords} = require('./db');
//--------------------------------------------------
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

conncetDB();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/users/admin', async (req, res) => {
    try {
        const users = await User.find({ name: "admin" });
        if (users.length === 0) {
            return res.status(404).json({ message: 'Keine Übereinstimmungen' });
        }
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Serverfehler' });
    }
});


//JSON Web Tokens beim Log-In erstellen und an Client senden
app.post('/log-in', async (req, res) => {
    const {name, password} = req.body;
    console.log(name, password);
    try {
        const findUser = await User.findOne({name});
        if (!findUser) {res.status(404).json({ message: 'Benutzer nicht gefunden' });} 
        
        const isMatch = await comparePasswords(password, findUser.password);
        if (!isMatch) {return res.status(401).json({ message: 'Passwort inkorrekt' });}

        //Token erstellen
        const token = jwt.sign({id: findUser._id, name: findUser.name}, process.env.JWT_SECRET, {expiresIn: '2h'});
        
        res.cookie('token', token, {httpOnly: true});
        res.redirect('/play-video');
    }
    catch (error){
        console.error(error);
        res.status(500).json({ message: 'Serverfehler' });
    }
})

//Middleware, um bei jeder Anfrage das benötigte JWT zu überprüfen
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(403).json({ message: 'Kein Token, Autorisierung verweigert' });
    }
    try {
        const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = tokenDecoded;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token ist nicht gültig' });
    }
};


//Route durch JWT schützen
app.get('/play-video', verifyToken, (req, res) => {
    res.sendFile(__dirname + '/view/video.html');
})


const httpsOptions = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

app.listen(port, '0.0.0.0', () => {
    console.log('HTTP Server läuft auf Port ' + port);
});

/*https.createServer(httpsOptions, app).listen(port, '0.0.0.0',() => {
    console.log('Server läuft auf Port ' + port);
});*/