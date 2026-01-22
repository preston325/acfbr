FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]
