# create Node image with app
FROM node:lts

# Define build-time arguments
ARG NODE_ENV

# Set environment variables
ENV NODE_ENV=${NODE_ENV:-dev}

COPY . /app

WORKDIR /app

RUN rm main.js

RUN npm install

CMD ["npm", "start"]

EXPOSE 3000