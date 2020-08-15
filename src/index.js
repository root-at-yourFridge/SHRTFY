const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const randomstring = require('randomstring');
const app = express();

const expression = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/gi
var regex = new RegExp(expression);

app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));

const Datastore = require('nedb'),
    db = new Datastore({ filename: './db/urls.db', autoload: true });

app.get('/shorten', (req, res) => {
    let url = req.headers.url;
    if(!url) {
        res.send("No url specified");
        return;
    }
    if (!url.match(regex)) {
        res.send("Invalid url");
        return;
    }

    let slug = generateSlug();
    putInDB(url, slug);
    var shorturl = {
        url: url,
        short: `https://shrtfy.de/v/${slug}`
    }
    res.send(shorturl);
});

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
                receiver: "My girlfriend",
                content: "I'm sorry for coding this much. I really love you. Please forgive me for what I said when I was debugging my code <3"
            },
            {
                receiver: "Employers",
                content: "Please fucking hire me. I don't want to be a store manager in a grocery store 'til I can retire :("
            }
        ]
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