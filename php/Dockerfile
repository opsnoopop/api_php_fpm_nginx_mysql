FROM php:8.4-fpm-alpine

# ติดตั้ง dependencies พื้นฐาน
RUN apk add --no-cache \
    autoconf \
    g++ \
    make \
    linux-headers \
    libstdc++ \
    openssl-dev \
    curl-dev \
    libcurl \
    zlib-dev \
    libxml2-dev \
    git \
    mariadb-connector-c-dev

# ติดตั้ง PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# เปิดใช้งาน OPcache พร้อม JIT
RUN docker-php-ext-install opcache

# เปิด JIT ผ่าน php.ini
RUN echo "zend_extension=opcache.so" >> /usr/local/etc/php/php.ini && \
    echo "opcache.enable=1" >> /usr/local/etc/php/php.ini && \
    echo "opcache.enable_cli=1" >> /usr/local/etc/php/php.ini && \
    echo "opcache.jit_buffer_size=256M" >> /usr/local/etc/php/php.ini && \
    echo "opcache.jit=tracing" >> /usr/local/etc/php/php.ini

WORKDIR /var/www/html
COPY ./index.php /var/www/html