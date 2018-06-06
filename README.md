# Homemade Dropbox

My graduation project

An office subsystem for document management in cloud computing environment

python3 + aiohttp + mysql

Reply on Qiniu object storage service

Deploy on Heroku cloud application platform (or other PaaS provider)

Using asynchronous generators for uploaded data reposting, so only Python 3.6 is support now.

## Deployment

Some environment varibles are required for program running
```
CLEARDB_DATABASE_URL={mysql url}
PORT={listening port}
QINIU_DOMAIN={qiniu bucket url}
QINIU_BUCKET={qiniu bucket name}
QINIU_ACCESS={qiniu access key}
QINIU_SECRET={qiniu secret key}
HEROKU_URL={server public address}
```
### Running Locally
create `virtualenv`

`pip install` dependencies from `requirements.txt`

set environment varibles by `export XXX='xxx'`

run `bash start`

### Deploying to Heroku

click button

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

or deploy by Heroku CLI like this
```
heroku create
heroku addons:create cleardb:ignite
heroku config:set HEROKU_URL=$(heroku info -s | grep web_url | cut -d= -f2)
heroku config:set XXX=xxx ...
git push heroku master
heroku open
```

### Running on Docker
```
sudo docker build -t homemade-dropbox .
sudo docker run -d \
     -e XXX=xxx\
     -e ...
     -p 8080:5000 \
     homemade-dropbox
```


## All APIs
```
GET	/account
POST	/signin	name={name}&email={email}&password={password}
POST	/signup	email={email}&password={password}&remember={remember}
POST	/signout

(OPTIONS)POST	/upload	?dir={dir}
GET	/list	?dir={dir}
GET	/tree
GET	/recycle	?dir={dir}
POST	/status	dir={dir}&name={name}
GET	/preview	?path={path}&version={version}
GET	/history	?path={path}

GET	/share	?path={path}
POST	/share	?path={path}
DELETE	/share	?path={path}

POST	/makedir dir={dir}&name={name}
POST	/makedirs	dir={dir}&name={name}
POST	/rename	dir={dir}&name={name}&rename={rename}

POST	/move	dir={dir}&name={name}
POST	/copy	dir={dir}&name={name}

POST	/remove	dir={dir}&name={name}
POST	/smash	dir={dir}&name={name}
POST	/recover	dir={dir}&name={name}

POST	/compress	dir={dir}&name={name}

GET	/source/{filename}	?source={source}
GET	/thumbnail/{filename}	?source={source}&size={size}
GET	/download/{filename}	?source={source}/?tag={tag}
GET	/release/{filename}	?source={source}

GET	/office/{filename}	?source={source}
GET	/pdf/{filename}	?source={source}
```