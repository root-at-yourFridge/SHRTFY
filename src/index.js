// I'm sorry for my inconsistent comments. I just don't like to comment my code...


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
app.use(express.static(__dirname, { dotfiles: 'allow' }));

// Set database to connect to
const Datastore = require('nedb'),
    db = new Datastore({ filename: './db/urls.db', autoload: true });
db.ensureIndex({
    fieldName: "slug",
    unique: true
}, (err) => console.log(err));

// Endpoint to create a shortened url
app.get('/shorten', (req, res) => {
    let url = req.headers.url; // url set in headers
    let publicKey = null; // init public key
    let slug = null; // init slug

    if (req.header(process.env.PUBLIC_KEY)) publicKey = req.header(process.env.PUBLIC_KEY); // check if public key is set
    console.log(req.header(process.env.PUBLIC_KEY));

    if (!url) {
        res.send("No url specified"); // abort if url header is not set
        return;
    }

    if (!url.match(regex)) {
        res.send("Invalid url"); // abort if the given url is not in valid format
        return;
    }

    slug = generateSlug();
    var schema = {
        url: url,
        slug: slug,
        key: publicKey
    };

    db.insert(schema, function (err, newDoc) {
        err ? console.log(`ERROR: ${err}`) : console.log("DONE");
        console.log(newDoc);
        if (newDoc == undefined) {
            res.send("The slug is already in use");
            return;
        } else {
            console.log("newDoc is not undefined");
            var shorturl = { // Object to be returned
                url: url,
                short: `${process.env.BASE_URL}v/${slug}`,
                key: publicKey
            }
            res.send(shorturl);
        }
    });
});

app.get('/custom', (req, res) => {
    let url = req.headers.url; // url set in headers
    let publicKey = null; // init public key (not required)
    let slug = null; // init slug
    if (req.header('slug')) { // check if header slug is set (not required)
        slug = req.header('slug');
    }

    console.log(process.env.SECRET_KEY);
    console.log(process.env.SECRET_VALUE);
    console.log(req.header(process.env.SECRET_KEY));
    if (!req.header(process.env.SECRET_KEY) || !req.header(process.env.SECRET_KEY) == process.env.SECRET_VALUE) {
        console.log(req.header(process.env.SECRET_KEY));
        res.send(process.env.SECRET_FAIL);
        return;
    }

    if (req.header(process.env.PUBLIC_KEY)) publicKey = req.header(process.env.PUBLIC_KEY); // check if secret key is set
    console.log(req.header(process.env.PUBLIC_KEY));

    if (!url) {
        res.send("No url specified"); // abort if url header is not set
        return;
    }

    if (!url.match(regex)) {
        res.send("Invalid url"); // abort if the given url is not in valid format
        return;
    }

    if (slug == null) {
        res.send("Slug is required"); // abort if slug is not set
        return;
    }

    if (slug.length < 4 || slug.length > 15) {
        res.send("Slug must be between 4 and 15 characters long");
        return;
    }

    var schema = {
        url: url,
        slug: slug,
        key: publicKey
    };

    db.insert(schema, function (err, newDoc) {
        err ? console.log(`ERROR: ${err}`) : console.log("DONE");
        console.log(newDoc);
        if (newDoc == undefined) {
            res.send("The slug is already in use");
            return;
        } else {
            console.log("newDoc is not undefined");
            var shorturl = { // Object to be returned
                url: url,
                short: `${process.env.BASE_URL}v/${slug}`,
                key: publicKey
            }
            res.send(shorturl);
        }
    });
});

app.get('/v/:slug', (req, res) => { // shrtfy.de/v/{random_code}
    var slug = req.params.slug;
    db.find({ slug: slug }, function (err, docs) {
        if (docs.length == 0) { // abort if slug not in database
            res.send("Invalid slug");
            return;
        }
        console.log(docs);
        var url = docs[0].url;

        // if header "noredir" is present redirect, else respond with object
        (req.headers.noredir != "true") ? res.redirect(url) : res.send({ slug: slug, url: url });
    });
});

app.get('/get/:slug', (req, res) => { // shrtfy.de/v/{random_code}
    var slug = req.params.slug;
    db.find({ slug: slug }, function (err, docs) {
        if (docs.length == 0) { // abort if slug not in database
            res.send("Invalid slug");
            return;
        }
        console.log(docs);
        var url = docs[0].url;

        // if header "noredir" is present redirect, else respond with object
        res.send({ slug: slug, url: url });
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
                receiver: "Employers",
                content: "Please fucking hire me. I don't want to be a store manager in a grocery store 'til I can retire :("
            },
            {
                receiver: "Visitor",
                content: "Welcome to SHRTFY. Feel free to shorten as many urls as you like. And if you know someone who might want to hire me, please refer them to this[2]"
            }
        ]
    });
});

// Modify the slug after creation (only available for secret pro users)
app.put('/edit', (req, res) => {
    let publicKey; // init public key (not required)
    let slug; // init slug
    let newSlug;
    let url;
    let exists = false;

    // Authentication
    console.log(process.env.SECRET_KEY);
    console.log(process.env.SECRET_VALUE);
    console.log(req.header(process.env.SECRET_KEY));
    if (!req.header(process.env.SECRET_KEY) || !req.header(process.env.SECRET_KEY) == process.env.SECRET_VALUE) {
        console.log(req.header(process.env.SECRET_KEY));
        res.send(process.env.SECRET_FAIL);
        return;
    }

    if (req.header(process.env.PUBLIC_KEY)) {
        publicKey = req.header(process.env.PUBLIC_KEY); // check if public key is set
        console.log(req.header(process.env.PUBLIC_KEY));
    }

    if (!req.header('slug')) { // check if header slug is set (required)
        res.send("You need to provide a slug to change");
        return;
    }
    slug = req.header('slug');

    if (!req.header('newSlug')) { // check if header newSlug is set (required)
        res.send("You need to provide a new Slug");
        return;
    }
    newSlug = req.header('newSlug');

    db.find({ slug: slug, key: publicKey }, function (err, docs) {
        console.log(`found entry with ${slug} and ${publicKey}\nDoc: ${docs}`);
        exists = (docs.length > 0);
        console.log(`dbfind: ${exists}`);
        
        if (exists) {
            url = docs[0].url;
            var schema = {
                slug: newSlug,
                key: publicKey,
                url: url
            };

            db.insert(schema, function (err, newDoc) {
                err ? console.log(`ERROR: ${err}`) : console.log("DONE");
                console.log(newDoc);
                if (newDoc == undefined) {
                    res.send("The slug is already in use");
                    return;
                } else {
                    console.log("newDoc is not undefined");
                    var shorturl = { // Object to be returned
                        url: url,
                        short: `${process.env.BASE_URL}v/${newSlug}`,
                        key: publicKey
                    }
                    res.send(shorturl);
                    return;
                }
            });
        } else {
            res.status(401).send("Something isn't right here");
            return;
        }
    });

});

app.get('/test/:slug::key', (req, res) => {
    db.find({ slug: req.params.slug, key: req.params.key }, function (err, docs) {
        console.log(docs);
        res.send("docs");
    });
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
                url: "/custom",
                usage: "You need to be subscribed via rapidapi.com to use this"
            },
            {
                url: "/edit",
                usage: "You need to be subscribed via rapidapi.com to use this"
            },
            {
                url: "/info",
                usage: "/info to get some information about the author (hehe...that's me)"
            }
        ]
    });
});

app.listen(process.env.PORT, process.env.IP_ADDR, () => {
    console.log('listening on port 80');
});

function generateSlug() {
    let slug = randomstring.generate(7); // Generate a random string with length = 7
    if (checkForUniqueSlug(slug) > 0) { // Recursive function call to handle a not unique slug
        generateSlug(); // Generate another one
    } else {
        return slug; // Finally return the slug
    }
}

function checkForUniqueSlug(slug) {
    db.find({ slug: slug }, function (err, docs) {
        console.log(`found ${docs.length} entries with slug ${slug}`);
        return docs.length; // If docs.length > 0 there is an entry already, therefor the calling function will evaluate to false
    });
}

// eslint-disable-next-line no-unused-vars
function auth(slug, key) {
    db.find({ slug: slug, key: key }, function (err, docs) {
        console.log(`found entry with ${slug} and ${key}\nDoc: ${docs}`)
        return docs.length;
    });
}

// eslint-disable-next-line no-unused-vars
function checkIfSlugExists(slug) {
    db.find({ slug: slug }, function (err, docs) {
        console.log(`found ${docs.length} entries`);
        return docs.length;
        // return (docs.length > 0) ? false : true;
    });
}

// eslint-disable-next-line no-unused-vars
function updateDatabase(slug, newSlug) {
    db.update({ slug: slug }, { slug: newSlug }, {}, function (err, numReplaced) {
        if (err) return false;
        console.log(`numreplaced: ${numReplaced}`);
        return true;
    });
}