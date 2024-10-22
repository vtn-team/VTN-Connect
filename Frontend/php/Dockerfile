FROM php:8.3-fpm-alpine

# 色々消しまくった

ARG environment

RUN apk upgrade --update
#  && apk --no-cache --virtual .build-deps add make g++ gcc re2c autoconf \
#  && apk --no-cache add gettext-dev libzip-dev curl-dev \
#  && docker-php-ext-install -j$(nproc) gettext mbstring zip opcache ctype json bcmath sockets curl \
#  && pecl channel-update pecl.php.net

# PDO(MySQL)
RUN docker-php-ext-install -j$(nproc) pdo_mysql

# YAML extension=yaml.so
#RUN apk --no-cache add yaml-dev \
#  && pecl install yaml \
#  && docker-php-ext-enable yaml

# APCu  extension=apcu.so
#RUN pecl install apcu \
#  && docker-php-ext-enable apcu

# igbinary extension=igbinary.so
#RUN pecl install igbinary \
#  && docker-php-ext-enable igbinary

# msgpack extension=msgpack.so
#RUN pecl install msgpack \
#  && docker-php-ext-enable msgpack

# redis extension=redis.so  (igbinary enabled)
#RUN curl -fsSL https://github.com/phpredis/phpredis/archive/6.1.0.tar.gz -o redis.tar.gz \
#  && mkdir -p /usr/src/php/ext/redis \
#  && tar xzf redis.tar.gz -C /usr/src/php/ext/redis --strip-components=1 \
#  && rm redis.tar.gz \
#  && docker-php-ext-configure redis --enable-redis-igbinary \
#  && docker-php-ext-install -j$(nproc) redis

# xdebug extension=xdebug.so
#RUN if [ "${environment}" = "local" ]; then \
#     pecl install xdebug \
#  && docker-php-ext-enable xdebug \
#  && echo "xdebug.remote_enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
#  && echo "xdebug.remote_connect_back=0" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
#  && echo "xdebug.remote_autostart=0" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
#  ; fi

#RUN apk del --purge .build-deps \
#  && docker-php-source delete \
#  && rm -rf /var/cache/apk/* \
#  && rm -rf /tmp/*

RUN deluser www-data \
    && addgroup -g 1000 -S www-data \
    && adduser -u 1000 -D -S -G www-data www-data