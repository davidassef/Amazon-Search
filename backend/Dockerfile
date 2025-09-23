# Use an official Node.js runtime as a parent image
FROM oven/bun:1-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and bun.lock files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "start"]
