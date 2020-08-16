// Add requirements
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const randomstring = require('randomstring');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const app = express();

// Regex for checking if the given url is in a valid format with protocol
const expression = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/gi
var regex = new RegExp(expression);

// Initialize middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));
app.use(express.static(__dirname, { dotfiles: 'allow'} ));

// Set database to connect to
const Datastore = require('nedb'),
    db = new Datastore({ filename: './db/urls.db', autoload: true });

// Endpoint to create a shortened url
app.get('/shorten', (req, res) => {
    let url = req.headers.url;
    let key = null;
    if(req.header('x-rapidapi-key')) key = req.header('x-rapidapi-key');
    if(!url) {
        res.send("No url specified"); // abort if url header is not set
        return;
    }
    if (!url.match(regex)) {
        res.send("Invalid url"); // abort if the given url is not in valid format
        return;
    }

    let slug = generateSlug();
    storeInDB(url, slug);
    var shorturl = { // Object to be returned
        url: url,
        short: `${process.env.BASE_URL}v/${slug}`,
        key: key
    }
    res.send(shorturl);
});

app.get('/v/:slug', (req, res) => { // shrtfy.de/v/{random_code}
var slug = req.params.slug;
    db.find({ slug: slug }, function (err, docs) {
        if(docs.length == 0) { // abort if slug not in database
            res.send("Invalid slug");
            return;
        }
        console.log(docs);
        var url = docs[0].url;
        
        var redirect = (req.headers.noredir == "true") ? false : true;

        // if header "noredir" is present && != false redirect, else respond with object
        // req.headers.noredir ? res.redirect(url) : res.send({url: docs[0].url});
        (redirect) ? res.redirect(url) : res.send({slug: slug, url: url});
    });
});

// This is self-explainatory, isn't it?
app.get('/info', (req, res) => {
    res.send({
        author: "Dennis Wiencke",
        contact: {
            mail: "root@yourFridge.online",
            twitter: "@ersatzgott",
            github: "root-at-yourFridge"
        }
    });
});

// Undocumented endpoint because why not...
app.get('/message', (req, res) => {
    res.send({
        sender: "Dennis Wiencke",
        messages: [
            {
                receiver: "Mom",
                content: "Hey mom, I hope I finally did something to make you proud"
            },
            {
                receiver: "Dad",
                content: "Huh!? You finally care 'bout me? I don't think so!"
            },
            {
                receiver: "Michelle",
                content: "I'm sorry for coding this much. I really love you. Please forgive me for what I said when I was debugging my code <3"
            },
            {
                receiver: "Employers",
                content: "Please fucking hire me. I don't want to be a store manager in a grocery store 'til I can retire :("
            }
        ]
    });
});

// Modify the slug after creation (only available for rapidapi pro users)
app.get('/modify', (req, res) => {
    if(req.header('x-rapidapi-key') == (undefined || null || "")) {
        res.send("You have to be subscribed to the pro plan on rapidapi.com");
        return;
    }
    res.send("Not yet implemented");
});

// shortfy.de returns the basic usage
app.get('/', (req, res) => {
    res.send({
        name: "SHRTFY is short for shortify",
        desc: "Use this API to create shortened urls and retrieve the long url afterwards",
        endpoints: [
            {
                url: "/shorten",
                usage: "/shorten/{url} to get a short url for your input url"
            },
            {
                url: "/v",
                usage: "/v/{slug} to retrieve the original (long) url"
            },
            {
                url: "/info",
                usage: "/info to get some information about the author (hehe...that's me)"
            }
        ]
    });
});

app.listen(80, process.env.IP_ADDR,() => {
    console.log('listening on port 80');
});

// I'm ging to comment the stuff below at some other time, if I want to :D

function storeInDB(url, slug) {
    var schema = {
        url: url,
        slug: slug
    };

    db.insert(schema, function (err, newDoc) {
        err ? console.log("ERROR") : console.log("DONE");
        console.log(newDoc);
    });
}

function generateSlug() {
    let slug = randomstring.generate(7); // Generate a random string with length = 7
    if(checkForUniqueSlug(slug) > 0) { // Recursive function call to handle a not unique slug
        generateSlug(); // Generate another one
    } else {
        return slug; // Finally return the slug
    }
}

function checkForUniqueSlug(slug) {
    db.find({ slug: slug }, function (err, docs) {
        console.log(docs.length);
        return docs.length; // If docs.length > 1 there is an entry already, therefor the calling function will evaluate to false
    });
}