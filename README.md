# Estética Automotriz

Software web para gerenciar um negócio de higienização automotiva entre cliente e prestador de serviço, com foco em agendamento, controle operacional e relacionamento com o cliente.

## Objetivo do software

Conectar cliente e prestador de serviço em uma única plataforma, facilitando a contratação, o agendamento e o acompanhamento dos serviços de higienização automotiva.  
Também apoiar o prestador na organização da operação, redução de falhas e controle do andamento dos atendimentos.

## Funcionalidades principais

- Cadastro de clientes e veículos.
- Cadastro de serviços e controle de pagamentos.
- Agendamento online de serviços.
- Criação de ordem de serviço com descrição do que será feito.
- Controle de status: agendado, em andamento, concluído e cancelado.
- Histórico dos serviços realizados.
- Notificações e lembretes para o cliente.
- Relatórios de faturamento e produtividade.

## Como executar com servidor e banco de dados

Este projeto usa:

- Servidor `Node.js` com `Express`.
- Banco de dados `SQLite` para persistir o estado da aplicação.

### 1. Instalar dependências

```bash
cd Est-tica-Automotriz-
npm install
```

### 2. Iniciar servidor

```bash
npm start
```

Depois acesse `http://localhost:3000`.

### Endpoints principais

- `GET /api/health`: status do servidor e caminho do banco.
- `GET /api/state`: carrega estado salvo.
- `PUT /api/state`: salva estado completo da aplicação.

## Estrutura da aplicação

- `index.html`: interface principal da plataforma.
- `styles.css`: estilos responsivos do painel.
- `app.js`: regras da aplicação, sincronização com API e fallback local.
- `server.js`: servidor Express e API.
- `database.js`: acesso ao banco SQLite.
- `data/estetica.db`: arquivo do banco de dados (criado automaticamente).

## Fluxo de uso

1. Cadastre clientes.
2. Cadastre os veículos vinculados aos clientes.
3. Registre agendamentos com data, horário, valor e observações.
4. Crie ordens de serviço vinculadas ou avulsas.
5. Atualize os status dos atendimentos.
6. Acompanhe histórico, lembretes e relatórios no painel.

## Publicação

A aplicação precisa de ambiente Node.js por usar backend e banco local SQLite.
