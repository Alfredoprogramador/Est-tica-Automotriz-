# Estética Automotriz

Software web para gerenciar um negócio de higienização automotiva entre cliente e prestador de serviço, com foco em agendamento, controle operacional e relacionamento com o cliente.

## Objetivo do software

Conectar cliente e prestador de serviço em uma única plataforma, facilitando a contratação, o agendamento e o acompanhamento dos serviços de higienização automotiva.  
Também apoiar o prestador na organização da operação, redução de falhas e controle do andamento dos atendimentos.

## Funcionalidades principais

- Cadastro de clientes e veículos.
- Agendamento online de serviços.
- Criação de ordem de serviço com descrição do que será feito.
- Controle de status: agendado, em andamento, concluído e cancelado.
- Histórico dos serviços realizados.
- Notificações e lembretes para o cliente.
- Relatórios de faturamento e produtividade.

## Como testar no navegador

Como a aplicação é estática, basta servir os arquivos do repositório em um servidor HTTP simples.

### Opção com Python

```bash
cd Est-tica-Automotriz-
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura da aplicação

- `index.html`: interface principal da plataforma.
- `styles.css`: estilos responsivos do painel.
- `app.js`: regras da aplicação, persistência em `localStorage` e relatórios.

## Fluxo de uso

1. Cadastre clientes.
2. Cadastre os veículos vinculados aos clientes.
3. Registre agendamentos com data, horário, valor e observações.
4. Crie ordens de serviço vinculadas ou avulsas.
5. Atualize os status dos atendimentos.
6. Acompanhe histórico, lembretes e relatórios no painel.

## Publicação

A aplicação pode ser publicada em qualquer hospedagem de arquivos estáticos, como GitHub Pages, Netlify, Vercel ou servidor web próprio.
