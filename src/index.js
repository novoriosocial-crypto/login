'use strict';

require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const { CONFIG_BOT, validarAmbiente } = require('./config');
const { registrarComandos } = require('./deploy-commands');
const revisar = require('./commands/revisar');
const registrarEntrada = require('./events/guildMemberAdd');

async function iniciar() {
  validarAmbiente();
  const token = process.env.TOKEN.trim();
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  registrarEntrada(client);
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'revisar') return;
    try {
      await revisar.execute(interaction);
    } catch (error) {
      console.error('Erro ao responder ao comando:', error.message);
      try {
        const resposta = { content: '❌ Não foi possível concluir o comando. Confira os logs do bot.', flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) await interaction.followUp(resposta);
        else await interaction.reply(resposta);
      } catch (falha) { console.error('Não foi possível enviar a resposta:', falha.message); }
    }
  });
  client.on(Events.Error, error => console.error('Erro do Discord:', error.message));
  client.once(Events.ClientReady, () => {
    (async () => {
      const guild = await client.guilds.fetch(CONFIG_BOT.ID_SERVIDOR);
      const cargo = await guild.roles.fetch(CONFIG_BOT.ID_CARGO_ALVO);
      if (!cargo) throw new Error('O cargo definido em CARGO_ALVO não existe no novo servidor.');
      if (!cargo.editable) throw new Error('O bot precisa de Gerenciar cargos e ficar acima do cargo Cidadão.');
      await registrarComandos(token, client.application.id);
      console.log(`✅ ${client.user.tag} online em ${guild.name}. /revisar registrado.`);
    })().catch(error => {
      console.error('Falha na inicialização:', error.message);
      client.destroy();
      process.exitCode = 1;
    });
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.once(sinal, () => { client.destroy(); process.exit(0); });
  }
  try { await client.login(token); }
  catch (error) { client.destroy(); throw error; }
}

if (require.main === module) {
  iniciar().catch(error => { console.error('Não foi possível iniciar o bot:', error.message); process.exitCode = 1; });
}

module.exports = { iniciar };
