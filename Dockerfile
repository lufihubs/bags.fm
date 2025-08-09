# Use the official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Create the data directory for the database
RUN mkdir -p data

# Expose the port the app runs on (not needed for bots but good practice)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
