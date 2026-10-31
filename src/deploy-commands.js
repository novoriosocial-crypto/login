'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { REST, Routes } = require('discord.js');
const { CONFIG_BOT } = require('./config');
const revisar = require('./commands/revisar');

async function registrarComandos(token, clientId) {
  if (!token) throw new Error('Defina TOKEN nas variáveis de ambiente com o token deste segundo bot.');
  const rest = new REST({ version: '10' }).setToken(token);
  if (!clientId) {
    const aplicativo = await rest.get(Routes.oauth2CurrentApplication());
    clientId = aplicativo.id;
  }
  await rest.put(Routes.applicationGuildCommands(clientId, CONFIG_BOT.ID_SERVIDOR), {
    body: [revisar.data.toJSON()]
  });
  return clientId;
}

if (require.main === module) {
  registrarComandos(process.env.TOKEN?.trim())
    .then(id => console.log(`✅ /revisar registrado no novo servidor para o aplicativo ${id}.`))
    .catch(error => { console.error('Erro ao registrar o comando:', error.message); process.exitCode = 1; });
}

module.exports = { registrarComandos };
