let express = require ('express');
let morgan = require ('morgan');
let mongoose = require('mongoose');

let app = express();
let bodyParser = require( "body-parser" );
let jsonParser = bodyParser.json();
// let bcrypt = require("bcryptjs");

let {BlogList} = require('./blog-post-model');
let {DATABASE_URL, PORT} = require('./config');
mongoose.Promise = global.Promise;

app.use(express.static('public'));
app.use( morgan( 'dev' ) );

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/blog-posts', ( req, res, next ) => {
    console.log("getting");
	BlogList.get()
		.then( blogs => {
			return res.status( 200 ).json( blogs );
		})
		.catch( error => {
			res.statusMessage = "Something went wrong with the DB. Try again later.";
			return res.status( 500 ).json({
				status : 500,
				message : "Something went wrong with the DB. Try again later."
			})
		});
});

app.post('/api/addPost', jsonParser, (req, res) => {
    console.log("posting");
    let title = req.body.title;
    let author = req.body.author;
    let content = req.body.content;
    let publishDate = req.body.publishDate;
    let id = req.body.id;
     console.log(title);
     console.log(content);
     console.log(id);
     if(!title || !content || !id){
         res.statusMessage = "Missing field in body";
         return res.status(406).json({
            "error" : "Missing field",
            "status" : 406
        });
     }
     let newBlog = {
         title,
         content,
         author,
         publishDate,
         id
     };
     BlogList.post(newBlog)
        .then(blog => {
            res.status(201).json(blog);
        })
        .catch(err => {
            res.statusMessage = "Something went wrong";
            return res.status(501).json({
                "error" : "Something went wrong with the data base",
                "status" : 501
            });
        });
});

app.put('/api/blog-posts/:id', jsonParser, (req, res, next) => {
    let filterID = req.params.id;
    if(!filterID || !req.body){
        res.statusMessage = "Missing field id";
        return res.status(406).json({
           "error" : "Missing id",
           "status" : 406
       });
    }
    BlogList.put({ id : filterID }, req.body)
       .then(blog => {
           res.status(201).json(blog);
       })
       .catch(err => {
           res.statusMessage = "Missing field in body";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});

app.delete('/api/blog-posts/:id', (req, res) => {
    let filterID = req.params.id;
    if(!filterID){
        res.statusMessage = "Missing field id";
        return res.status(406).json({
           "error" : "Missing id",
           "status" : 406
       });
    }
    BlogList.delete({ id : filterID })
       .then(blog => {
           res.status(201).json(blog);
       })
       .catch(err => {
           res.statusMessage = "Missing field in body";
           return res.status(500).json({
               "error" : "Something went wrong with the data base",
               "status" : 500
           });
       });
});


let server;

function runServer(port, databaseUrl){
    return new Promise( (resolve, reject ) => {
    mongoose.connect(databaseUrl, response => {
    if ( response ){
        return reject(response);
    }
    else{
        server = app.listen(port, () => {
        console.log( "App is running on port " + port );
        resolve();
    })
        .on( 'error', err => {
        mongoose.disconnect();
        return reject(err);
    })
    }
    });
    });
}
   
function closeServer(){
    return mongoose.disconnect()
            .then(() => {
    return new Promise((resolve, reject) => {
    console.log('Closing the server');
    server.close( err => {
        if (err){
            return reject(err);
        }
        else{
            resolve();
        }});
    });
    });
   }
   
runServer( PORT, DATABASE_URL )
    .catch( err => {
    console.log( err );
});
   
module.exports = { app, runServer, closeServer };