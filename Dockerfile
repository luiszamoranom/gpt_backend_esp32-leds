FROM node:20.11.0-alpine3.18

WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++ tzdata
# Establecer la zona horaria
ENV TZ=America/Santiago
RUN cp /usr/share/zoneinfo/America/Santiago /etc/localtime && \
    echo "America/Santiago" > /etc/timezone

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npx prisma generate
EXPOSE 9999
CMD [ "npm", "start" ]