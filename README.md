# Lia Messages API

API de mensagens para a Lia, assistente de vendas no WhatsApp.

## Sobre o projeto
A Lia é uma assistente de vendas que conversa com clientes pelo WhatsApp. Para isso, as mensagens dos clientes precisam ser recebidas e guardadas. Esta API faz esse trabalho: recebe, lê, edita e apaga mensagens (um CRUD).

Tecnologias usadas:

- Node.js 22 e TypeScript
- Express 5 (servidor HTTP)
- MySQL 8.4, rodando em Docker
- Prisma 7 (acesso ao banco e migrations)
- Zod (validação dos dados)
- Vitest e Supertest (testes)

### Estrutura de pastas

```
src/
  app.ts                   monta o app Express (rotas e tratamento de erros)
  server.ts                abre a porta e inicia o servidor
  errors/                  erro padronizado da aplicação (AppError)
  lib/prisma.ts            conexão com o banco
  middlewares/             tratador de erros e de rota não encontrada
  modules/messages/        rotas, validação (schema) e regras (service) das mensagens
prisma/                    schema do banco e migrations
tests/                     testes de integração
docker/mysql-init/         script que cria o banco de teste
docker-compose.yml         sobe o MySQL
```

## Como instalar e rodar

Requisitos: Node.js 22+, npm e Docker (com Docker Compose).

    cp .env.example .env
    npm install
    npm run db:up
    npm run dev

A API sobe em http://localhost:3000. Verifique com `curl http://localhost:3000/health`.

Para parar o banco: `npm run db:down`.

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento, recarregando ao salvar |
| `npm run build` | Compila o TypeScript para a pasta `dist` |
| `npm start` | Roda a versão compilada (use depois do `build`) |
| `npm test` | Roda os testes automatizados |
| `npm run db:up` | Sobe o MySQL no Docker |
| `npm run db:down` | Para o MySQL |
| `npm run prisma:migrate` | Cria e aplica uma nova migration (uso em desenvolvimento) | 


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

Há também o banco `lia_messages_test`, usado apenas pelos testes automatizados. Ele é criado automaticamente na primeira vez que o container sobe (script em `docker/mysql-init`). Se o volume do MySQL já existia antes, crie-o uma vez com:

    docker compose exec db mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS lia_messages_test;"

## Testes

Os testes são de integração: usam a aplicação Express em memória (Supertest) e um MySQL de verdade, no banco separado `lia_messages_test`, sem tocar nos dados de desenvolvimento.

```bash
npm run db:up
npm test
```

As migrations são aplicadas no banco de teste automaticamente antes da execução, e cada teste começa com a tabela vazia. Há também uma trava que aborta os testes se a conexão não apontar para o banco de teste. 


## Decisões

- **`phone` obrigatório na listagem**: a API lista as mensagens de um cliente. Listar tudo exporia dados de todos os clientes e cresceria sem limite.
- **Paginação com `limit` e `offset`** (padrão 50, máximo 100): respostas de tamanho previsível, e o `total` diz ao cliente se há mais páginas.
- **Ordem cronológica, da mais antiga para a mais nova**: é a ordem natural de uma conversa, com desempate pelo `messageId` para o resultado ser sempre o mesmo.
- **`404` para mensagem inexistente**, no mesmo formato de erro das outras rotas.
- **`PATCH` aceita só o `text`**: os demais campos descrevem a origem da mensagem (loja, cliente, horário de envio) e não devem ser alterados. O corpo é validado em modo estrito, então campos extras são recusados em vez de ignorados em silêncio.
- **`updatedAt` automático**: o Prisma atualiza esse campo a cada edição, e assim fica registrado quando a mensagem foi alterada.
- **`DELETE` responde `204` sem corpo**: é o padrão para exclusões bem-sucedidas, e não há o que devolver.
- **`404` ao apagar uma mensagem que já não existe**: assim quem chama a API sabe que nada foi apagado, em vez de receber um sucesso enganoso.
- **Exclusão definitiva (hard delete)**: a linha é removida do banco. Para o escopo do teste basta, e em um sistema real eu consideraria uma exclusão lógica (soft delete), registrando a data da exclusão.
- **Testes de integração com banco real, em vez de mocks**: o que mais pode quebrar é a combinação entre API, Prisma e MySQL (chave única, ordenação, erros do Prisma). Um banco falso não pegaria esses problemas.
- **Banco de teste separado e trava de segurança**: cada teste apaga as mensagens antes de rodar, então os testes recusam rodar se a conexão não for a do `lia_messages_test`.
- **`app.ts` separado de `server.ts`**: permite testar a API com Supertest sem abrir uma porta.

## O que eu faria com mais tempo
Realizei este projeto como uma task para um teste técnico, que envolveu estudar algumas tecnologias de maneira rápida, visando entregar o que foi requisitado efetivamente. No entanto, ainda há outras coisas que poderiam ser desenvolvidas num período de tempo mais longo. Essas coisas estão listadas abaixo, mais ou menos nessa ordem: 

**1. Proteger a API.** Hoje qualquer pessoa que consiga chamar a API pode criar, ler, editar e apagar mensagens, porque não existe nenhuma autenticação. Eu ainda não estudei isso a fundo, mas gostaria de aprender como garantir que quem envia as mensagens é mesmo o WhatsApp, e como limitar quem pode consultá-las.

**2. Pensar melhor no caso da mensagem repetida.** Quando a mesma mensagem chega duas vezes, a API responde `409`. Isso protege o banco, mas tenho dúvida se é a melhor resposta para um serviço que recebe eventos do WhatsApp: se ele tentar enviar de novo por causa do erro, talvez fosse melhor responder `200` ("já recebi"). Eu pesquisaria como o WhatsApp lida com isso antes de decidir.

**3. Cuidar do banco como em produção.** Usei o usuário `root` com a senha `root` e uma opção de conexão (`allowPublicKeyRetrieval`) que só é aceitável em desenvolvimento local. Em um ambiente real eu criaria um usuário com permissões limitadas, usaria conexão com TLS e guardaria as senhas fora do código.

**4. Melhorar as mensagens de erro.** As mensagens que vêm do Zod estão em inglês, e quando alguém manda um campo que não existe no `PATCH` o campo `field` da resposta vem vazio. Eu traduziria e padronizaria tudo em português.

**5. Organizar o código repetido.** O trecho que transforma o erro `P2025` do Prisma em `404` aparece no `PATCH` e no `DELETE`. Eu extrairia uma função para não repetir.

**6. Usar paginação por cursor.** Hoje a listagem usa `limit` e `offset`, que é mais simples, mas fica lenta quando há muitas mensagens. Eu estudaria a paginação por cursor.

**7. Guardar mensagens apagadas.** O `DELETE` apaga a linha de vez. Em um sistema real eu faria uma exclusão lógica, só marcando a mensagem como apagada e registrando quando.

**8. Melhorar o `/health`.** Hoje ele só diz que o servidor está de pé, e não verifica se o banco responde.

**9. Automatizar e empacotar.** Colocaria os testes para rodar sozinhos a cada push (GitHub Actions) e criaria um Dockerfile para a própria API, para subir tudo com um comando só. Hoje só o banco roda em Docker.

**10. Documentar e acompanhar a API.** Adicionaria uma documentação interativa (Swagger/OpenAPI) e logs mais úteis. 


