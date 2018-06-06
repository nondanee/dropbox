FROM python:3.6

ADD requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

ADD gunicorn.conf /app/gunicorn.conf
ADD start /app/start
ADD /server /app/server
ADD /static /app/static
WORKDIR /app

ENV PORT=5000
EXPOSE  5000
CMD ["bash","start"]
