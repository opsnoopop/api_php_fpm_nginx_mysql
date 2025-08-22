FROM nginx:1.27-alpine
COPY ./nginx/conf/conf.d/ /etc/nginx/conf.d/
COPY ./index.php /var/www/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]