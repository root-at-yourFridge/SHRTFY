# SHRTFY

## Shorten a url
Make a GET request to /shorten and set the longurl as header "url"
```
curl -H "url: https://google.com" http://shrtfy.de/shorten
```

Optional: Set a slug as header "slug" to create your own (if not used yet)
```
curl -H "url: https://google.com" -H "slug: google" http://shrtfy.de/shorten
```

## Retrieve an url
Just open the link in your browser or get the redirect with curl
```
curl http://shrtfy.de/v/${slug}
```

## Get API usage
Make a GET request to /
```
curl https://shrtfy.de/
```

## Get information about the author
Make a GET request to /info
```
curl http://shrtfy.de/info
```

## There are some more undocumented endpoints, though

## dotenv configuration
Rename .env.example to .env and change the values to your own values