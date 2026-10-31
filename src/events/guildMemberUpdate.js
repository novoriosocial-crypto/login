'use strict';

const { Events } = require('discord.js');
const { CONFIG_BOT, nomeCidadao } = require('../config');

// Mantido como módulo opcional; não é ativado pelo index.js, como no original.
module.exports = client => {
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (newMember.guild.id !== CONFIG_BOT.ID_SERVIDOR || newMember.user.bot) return;
    const tinha = oldMember.roles.cache.has(CONFIG_BOT.ID_CARGO_ALVO);
    const tem = newMember.roles.cache.has(CONFIG_BOT.ID_CARGO_ALVO);
    if (!tinha && tem) {
      try { await newMember.setNickname(nomeCidadao(newMember)); }
      catch (error) { console.error('Não foi possível atualizar o apelido:', error.message); }
    }
  });
};
