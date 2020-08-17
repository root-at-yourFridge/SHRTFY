# SHRTFY

## Shorten a url
Make a GET request to /shorten and set the longurl as header "url"
```
curl -H "url: https://google.com" http://shrtfy.de/shorten
```

## Retrieve an url
Just open the link in your browser or get the redirect with curl
```
curl http://shrtfy.de/v/${slug}
```

Optional: Set header 'noredir' to true to get an object returned
```
curl -H "noredir: true" http://shrtfy.de/v/${slug}
```

Optional: If you don't want to get redirected in the browser use endpoint /get
Works in curl as well, so you don't need to set headers...
```
curl http://shrtfy.de/get/${slug}
```

## Generate custom short url (only rapidapi pro)
Endpoint: /custom

Not working with curl because there a specific secret headers to be set.

## Edit existing slug (only rapidapi pro)
Endpoint: /edit

Not working with curl because there a specific secret headers to be set.

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