'use strict';

const { Events } = require('discord.js');
const { CONFIG_BOT, nomeCidadao } = require('../config');

module.exports = client => {
  client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id !== CONFIG_BOT.ID_SERVIDOR || member.user.bot || member.id === member.guild.ownerId) return;
    try {
      const cargo = await member.guild.roles.fetch(CONFIG_BOT.ID_CARGO_ALVO);
      if (!cargo) throw new Error('O cargo definido em CARGO_ALVO não foi encontrado.');
      await member.roles.add(cargo.id);
      await member.setNickname(nomeCidadao(member));
      console.log(`✅ Cargo e nome de entrada configurados para ${member.user.tag}.`);
    } catch (error) {
      console.error(`Erro ao configurar a entrada de ${member.user.tag}:`, error.message);
    }
  });
};
