FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html
COPY wx /usr/share/nginx/html/wx

EXPOSE 80
EXPOSE 443
