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

### Editar o texto de uma mensagem: `PATCH /messages/:messageId`

```bash
curl -i -X PATCH http://localhost:3000/messages/wamid.HBgM123 \
  -H "Content-Type: application/json" \
  -d '{"text": "vocês têm tênis preto tamanho 42 em estoque?"}'
```

Resposta `200 OK` com a mensagem atualizada (o `updatedAt` muda; `createdAt` e `timestamp` não).

Só o campo `text` pode ser editado. Qualquer outro campo no corpo resulta em `400 VALIDATION_ERROR`, e um `messageId` inexistente resulta em `404 MESSAGE_NOT_FOUND`.

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

### Apagar uma mensagem: `DELETE /messages/:messageId`

```bash
curl -i -X DELETE http://localhost:3000/messages/wamid.HBgM125
```

Resposta `204 No Content`, sem corpo. Um `messageId` inexistente resulta em `404 MESSAGE_NOT_FOUND`, inclusive se a mesma mensagem for apagada duas vezes.

## Banco de Dados

O MySQL 8.4 roda em um container Docker, definido no `docker-compose.yml`. Os dados ficam em um volume (`mysql_data`) e sobrevivem a um `npm run db:down`.

O banco fica exposto na porta **3307** (e não na 3306) para não conflitar com um MySQL já instalado na máquina. As credenciais de desenvolvimento estão em `.env.example`.

## Decisões
_Em construção._
- **`phone` obrigatório na listagem**: a API lista as mensagens de um cliente. Listar tudo exporia dados de todos os clientes e cresceria sem limite.
- **Paginação com `limit` e `offset`** (padrão 50, máximo 100): respostas de tamanho previsível, e o `total` diz ao cliente se há mais páginas.
- **Ordem cronológica, da mais antiga para a mais nova**: é a ordem natural de uma conversa, com desempate pelo `messageId` para o resultado ser sempre o mesmo.
- **`404` para mensagem inexistente**, no mesmo formato de erro das outras rotas.
- **`PATCH` aceita só o `text`**: os demais campos descrevem a origem da mensagem (loja, cliente, horário de envio) e não devem ser alterados. O corpo é validado em modo estrito, então campos extras são recusados em vez de ignorados em silêncio.
- **`updatedAt` automático**: o Prisma atualiza esse campo a cada edição, e assim fica registrado quando a mensagem foi alterada.
- **`DELETE` responde `204` sem corpo**: é o padrão para exclusões bem-sucedidas, e não há o que devolver.
- **`404` ao apagar uma mensagem que já não existe**: assim quem chama a API sabe que nada foi apagado, em vez de receber um sucesso enganoso.
- **Exclusão definitiva (hard delete)**: a linha é removida do banco. Para o escopo do teste basta, e em um sistema real eu consideraria uma exclusão lógica (soft delete), registrando a data da exclusão.

## O que eu faria com mais tempo
_Em construção._
