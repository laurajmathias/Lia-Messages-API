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

### Ler uma mensagem: `GET /messages/:messageId`

```bash
curl -i http://localhost:3000/messages/wamid.HBgM123
```

Resposta `200 OK` com a mensagem (mesmo formato do `POST`) ou `404 MESSAGE_NOT_FOUND`.

### Ler as mensagens de um cliente: `GET /messages?phone=...`

```bash
curl -i "http://localhost:3000/messages?phone=5511999998888"
```

Parâmetros:

- `phone` (obrigatório): telefone do cliente.
- `storeId` (opcional): só as mensagens daquela loja.
- `limit` (opcional): itens por página, padrão 50 e máximo 100.
- `offset` (opcional): quantos itens pular, padrão 0.

Resposta `200 OK`, com as mensagens em ordem cronológica:

```json
{
  "data": [ { "messageId": "wamid.HBgM123", "...": "..." } ],
  "pagination": { "limit": 50, "offset": 0, "total": 3 }
}
```

Sem `phone`, ou com parâmetros inválidos, a resposta é `400 VALIDATION_ERROR`.

## Banco de Dados

O MySQL 8.4 roda em um container Docker, definido no `docker-compose.yml`. Os dados ficam em um volume (`mysql_data`) e sobrevivem a um `npm run db:down`.

O banco fica exposto na porta **3307** (e não na 3306) para não conflitar com um MySQL já instalado na máquina. As credenciais de desenvolvimento estão em `.env.example`.

## Decisões
_Em construção._
- **`phone` obrigatório na listagem**: a API lista as mensagens de um cliente. Listar tudo exporia dados de todos os clientes e cresceria sem limite.
- **Paginação com `limit` e `offset`** (padrão 50, máximo 100): respostas de tamanho previsível, e o `total` diz ao cliente se há mais páginas.
- **Ordem cronológica, da mais antiga para a mais nova**: é a ordem natural de uma conversa, com desempate pelo `messageId` para o resultado ser sempre o mesmo.
- **`404` para mensagem inexistente**, no mesmo formato de erro das outras rotas.

## O que eu faria com mais tempo
_Em construção._
