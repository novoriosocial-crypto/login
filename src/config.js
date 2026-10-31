'use strict';

const CONFIG_BOT = {
  ID_SERVIDOR: '1360772568436576536',
  // O cargo Cidadão é diferente das patentes/companhias do primeiro bot.
  ID_CARGO_ALVO: process.env.CARGO_ALVO?.trim() || '',
  PREFIXO_NOME: 'Cidadão. '
};

function validarAmbiente() {
  if (!process.env.TOKEN?.trim()) {
    throw new Error('Defina TOKEN nas variáveis de ambiente com o token deste segundo bot.');
  }
  if (!/^\d{17,20}$/.test(CONFIG_BOT.ID_CARGO_ALVO)) {
    throw new Error('Defina CARGO_ALVO com o ID do cargo Cidadão do novo servidor.');
  }
}

function nomeCidadao(member) {
  const nomeBase = member.user.globalName || member.user.username;
  return `${CONFIG_BOT.PREFIXO_NOME}${nomeBase}`.substring(0, 32);
}

module.exports = { CONFIG_BOT, validarAmbiente, nomeCidadao };
