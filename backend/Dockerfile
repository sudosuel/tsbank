# Use a base image com Node.js
FROM node:20

# Defina o diretório de trabalho no container
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm ci

# Copie todo o código do projeto para o diretório de trabalho
COPY . .

# Execute o build do projeto
RUN npm run build

RUN npx prisma generate

# Exponha a porta 8080
EXPOSE 8080

# Comando para rodar a aplicação
CMD [ "npm", "run", "start:prod" ]