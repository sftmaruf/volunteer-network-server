const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 100000 }));

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer-network-own.firebaseio.com"
});

app.get('/', (req, res) => {
    res.send('working');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f1z8e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const workDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONONE);
    const volunteersDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONTWO);

    app.post('/registeredVolunteer', (req, res) => {
        volunteersDB.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    });

    app.get('/volunteerWorks', (req, res) => {
        workDB.find({})
            .toArray((err, works) => {
                res.send(works);
            })
    });

    app.get('/volunteerJoinedWork', (req, res) => {
        const userEmail = req.query.email;
        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
                .then(decodedToken => {
                    if (userEmail == decodedToken.email) {
                        findVolunteerTask(res, decodedToken.email)
                    }
                })
                .catch(error => {
                    res.status(401).send();
                });
        } else {
            res.status(401).send('unauthorized access');
        }
    });

});

app.listen(process.env.PORT || 5000);