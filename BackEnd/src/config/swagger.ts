import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maze Bank',
      version: '1.0.0',
      description: 'Documentação da API gerada com Swagger e TS',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'API - MazeBank',
      },
    ],
  },
  // Caminho para os arquivos que contêm as rotas documentadas (pode ser .ts ou .js compilado)
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
