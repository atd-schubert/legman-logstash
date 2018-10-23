FROM node:latest

MAINTAINER Arne Schubert <atd.schubert@gmail.com>

WORKDIR /opt/legman-logstash

# Make dependencies cacheable
COPY ./package-lock.json ./package.json /opt/legman-logstash/
RUN npm i

COPY . /opt/legman-logstash
RUN npm run transpile

CMD ["npm", "test"]
