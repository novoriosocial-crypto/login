# Bot Cidadão — entrada e revisão

Configurado para o mesmo servidor do primeiro bot: **1360772568436576536**.

## Funções mantidas

- Ao entrar um membro humano, atribui o cargo de entrada e o apelido `Cidadão. Nome`.
- Usa o nome de exibição do usuário, ou o username quando não há nome de exibição, com limite de 32 caracteres.
- O comando `/revisar` mantém o funcionamento do código original: **remove os cargos atuais dos membros e deixa o cargo Cidadão**, além de corrigir o apelido.
- Bots e o dono do servidor são ignorados na revisão. Membros que o bot não pode gerenciar são contabilizados como falhas/hierarquia alta.

**O `/revisar` também remove patentes e companhias atribuídas pelo primeiro bot. Execute apenas quando quiser fazer essa limpeza geral.** Ele não é executado automaticamente ao ligar. A atribuição na entrada adiciona o cargo de Cidadão, sem fazer limpeza geral.

O comando está registrado somente para administradores e também verifica a permissão na execução.

## Falta configurar o cargo Cidadão

O novo ID desse cargo ainda não foi informado. Por isso ele ficou na variável **`CARGO_ALVO`**, sem reaproveitar algum cargo militar por suposição.

Configure estas duas variáveis no painel da hospedagem:

| Nome | Valor |
| --- | --- |
| `TOKEN` | Token da aplicação deste segundo bot |
| `CARGO_ALVO` | ID do cargo Cidadão/entrada no novo servidor |

O ID do servidor já está preenchido em `src/config.js`. O ID do aplicativo é identificado pelo token. Não é necessário configurar `CLIENT_ID` ou `GUILD_ID`.

## Hospedar no Bot-Hosting.net

1. Crie/selecione o aplicativo deste bot em [Bot-Hosting.net](https://bot-hosting.net/).
2. Selecione **Node.js 24**, versão a partir de 24.17.0.
3. Envie e extraia este ZIP. O arquivo `package.json` deve ficar na raiz, ao lado da pasta `src`. O ZIP já foi organizado assim. Não envie `node_modules` nem um `.env` com token dentro do pacote.
4. No campo do arquivo principal, se solicitado, informe **`src/index.js`**.
5. Em **Environment/variáveis de ambiente**, preencha `TOKEN` e `CARGO_ALVO`, sem aspas.
6. Configure o comando de inicialização:

```bash
npm ci && npm start
```

7. Inicie e confira a mensagem de bot online e `/revisar` registrado. Não é preciso executar `npm run deploy` separadamente.

Este bot usa seu próprio token e processo. Conforme a oferta gratuita anunciada pelo provedor, há limite de um deploy e renovação manual a cada quatro dias; confira a capacidade disponível antes de tentar manter os dois bots simultaneamente.

Ele não usa banco ou arquivo de fichas: as mudanças são feitas no Discord.

## Preparar o bot no Discord

1. No [Discord Developer Portal](https://discord.com/developers/applications), selecione a aplicação deste segundo bot e obtenha seu token.
2. Em **Bot → Privileged Gateway Intents**, ative **Server Members Intent**. Message Content Intent não é necessário.
3. Convide o bot para o servidor com os escopos `bot` e `applications.commands` e permissões para **Gerenciar cargos**, **Gerenciar apelidos**, ver canais, enviar mensagens e enviar embeds.
4. Coloque o cargo do bot acima do cargo Cidadão e dos membros/cargos que ele precisará limpar e renomear.
5. Use `/revisar` com um administrador apenas quando desejar limpar os cargos dos membros do servidor.

## Rodar no PC

Copie `.env.example` para `.env` e preencha `TOKEN` e `CARGO_ALVO`. Depois, na pasta que contém `package.json`:

```bash
npm ci
npm start
```

O comando `npm test` verifica as regras sem conectar o bot ao Discord ou alterar membros. O comando opcional `npm run deploy` registra `/revisar` usando o mesmo token e servidor; normalmente a inicialização já faz isso.

## Referências

- [Node.js no Bot-Hosting.net](https://bot-hosting.net/nodejs-hosting)
- [Permissões e hierarquia do Discord](https://docs.discord.com/developers/topics/permissions)
- [Gateway Intents do Discord](https://docs.discord.com/developers/events/gateway)
