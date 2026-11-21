# Lia Messages API

API de mensagens para a Lia, assistente de vendas no WhatsApp.

## Sobre o projeto
_Em construção._

## Como instalar e rodar

Requisitos: Node.js 22+, npm e Docker (com Docker Compose).

    cp .env.example .env
    npm install
    npm run db:up
    npm run dev

A API sobe em http://localhost:3000. Verifique com `curl http://localhost:3000/health`.

Para parar o banco: `npm run db:down`.

## Como usar
_Em construção._

## Banco de Dados

O MySQL 8.4 roda em um container Docker, definido no `docker-compose.yml`. Os dados ficam em um volume (`mysql_data`) e sobrevivem a um `npm run db:down`.

O banco fica exposto na porta **3307** (e não na 3306) para não conflitar com um MySQL já instalado na máquina. As credenciais de desenvolvimento estão em `.env.example`.

## Decisões
_Em construção._

## O que eu faria com mais tempo
_Em construção._
