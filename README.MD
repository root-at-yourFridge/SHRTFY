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

## Generate custom short url (only rapidapi pro)
Make a GET request to /custom and set the headers url: longurl, slug: slug
```
curl -H "url: https://google.com" -H "slug: google" http://shrtfy.de/custom
```

## Edit existing slug (only rapidapi pro)
Make a PUT request to /edit and set the headers like below
```
curl -X PUT -H "slug: ${yourSlug}" -H "slug: ${newSlug}" http://shrtfy.de/edit
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