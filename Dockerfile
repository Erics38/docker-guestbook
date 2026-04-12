# Use the official nginx image as base
FROM nginx:alpine

# Apply security updates
RUN apk update && apk upgrade

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy our HTML and CSS files to nginx's default directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# nginx starts automatically with this image, so no CMD needed