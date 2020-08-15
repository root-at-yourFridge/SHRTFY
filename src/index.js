const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const randomstring = require('randomstring');
const app = express();

var expression = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;
var regex = new RegExp(expression);

app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

const Datastore = require('nedb'),
    db = new Datastore({ filename: './db/urls.db', autoload: true });

app.get('/shorten', (req, res) => {
    let url = req.headers.url;
    if (!url.match(regex)) {
        res.send("Invalid url");
        return;
    }

    let slug = generateSlug();
    putInDB(url, slug);
    var shorturl = {
        url: url,
        // FIXME: Replace localhost with shrtfy
        short: `https://shrtfy.de/v/${slug}`
        // short: `http://localhost:3001/v/${slug}`
    }
    //console.log(req);
    res.send(shorturl);
});

// FIXME: REMOVE BEFORE FLIGHT!
// app.get('/debug', (req, res) => {
//     let url = req.headers.url;
//     let slug = req.headers.slug;
//     if (!url.match(regex)) {
//         res.send("Invalid url");
//         return;
//     }

//     res.send(checkForUniqueSlug(slug));
// });

app.get('/v/:slug', (req, res) => {
    db.find({ slug: req.params.slug }, function (err, docs) {
        console.log(docs);
        var url = docs[0].url;
        
        res.redirect(url);
    });
});

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

app.listen(3001, () => {
    console.log('listening on port 3001');
});

function putInDB(url, slug) {
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
    let slug = randomstring.generate(7);
    if(checkForUniqueSlug(slug) > 0) {
        generateSlug();
    } else {
        return slug;
    }
}

function checkForUniqueSlug(slug) {
    db.find({ slug: slug }, function (err, docs) {
        console.log(docs.length);
        return docs.length;
    });
}