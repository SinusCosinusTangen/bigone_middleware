FROM node

# Create application directory and set permissions
RUN mkdir -p /app && chown -R node:node /app

# Create /keys directory for storing keys
RUN mkdir -p /keys && chown -R node:node /keys

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY --chown=node:node package*.json ./

# Install dependencies as a non-root user
USER node
RUN npm install

# Copy application source code after dependencies are installed
COPY --chown=node:node . .

# Copy .env
COPY --chown=node:node .env ./src

# Expose the correct port
EXPOSE 8081

WORKDIR /app/src

# Use ts-node to execute TypeScript or compile the code first
# CMD ["/bin/sh"]
CMD ["npx", "ts-node", "app.ts"]