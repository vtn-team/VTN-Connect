# Dockerfile
FROM mariadb

RUN apt update -y
RUN apt install curl -y
RUN curl https://gist.githubusercontent.com/nyangame/2c464bcee7e9d81abe8972ea03ecafa8/raw/cae6214b2a4fabcee78f7ad90c866559187a31f3/SocialGmaeDBImport.sql > /docker-entrypoint-initdb.d/import.sql

# COPY import.sql /docker-entrypoint-initdb.d/ #error
# RUN mysql -u${DB_USERNAME} -p${DB_PASSWORD} < import.sql # mysql not found
