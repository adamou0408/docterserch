# Spec: specs/hospital-clinic-map-search/spec.md
# Task: specs/hospital-clinic-map-search/tasks.md — Task 8

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

# Provide a dummy DATABASE_URL for build-time static generation
# The real URL is injected at runtime via docker-compose environment
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
