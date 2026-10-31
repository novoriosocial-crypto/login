'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const ambienteAnterior = { cargo: process.env.CARGO_ALVO, token: process.env.TOKEN };
process.env.CARGO_ALVO = '100000000000000001';
const { Collection, PermissionsBitField, PermissionFlagsBits, Events } = require('discord.js');
const { CONFIG_BOT, nomeCidadao, validarAmbiente } = require('../src/config');
const revisar = require('../src/commands/revisar');
const entrada = require('../src/events/guildMemberAdd');
after(() => {
  for (const [chave, anterior] of [['CARGO_ALVO', ambienteAnterior.cargo], ['TOKEN', ambienteAnterior.token]]) {
    if (anterior === undefined) delete process.env[chave];
    else process.env[chave] = anterior;
  }
});

function contexto() {
  const chamadas = { cargos: [], nomes: [], adicionados: [], respostas: [], resultados: [], buscas: 0 };
  const cargo = { id: CONFIG_BOT.ID_CARGO_ALVO, editable: true };
  const membros = new Collection();
  const guild = {
    id: CONFIG_BOT.ID_SERVIDOR, ownerId: '100000000000000099',
    roles: { async fetch(id) { assert.equal(id, cargo.id); return cargo; } },
    members: {
      async fetch() { chamadas.buscas++; return membros; },
      async fetchMe() { return { permissions: new PermissionsBitField([PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageNicknames]) }; }
    }
  };
  function membro(id, opcoes = {}) {
    const m = {
      id, guild, manageable: true, nickname: null,
      user: { id, username: 'usuario', globalName: 'Nome de Exibição', bot: false, tag: 'usuario' },
      roles: {
        cache: new Collection([[guild.id, { id: guild.id }], ['100000000000000002', { id: '100000000000000002' }]]),
        async set(ids) {
          chamadas.cargos.push({ id, ids });
          this.cache = new Collection([[guild.id, { id: guild.id }], ...ids.map(r => [r, { id: r }])]);
        },
        async add(roleId) { chamadas.adicionados.push({ id, roleId }); }
      },
      async setNickname(nome) { chamadas.nomes.push({ id, nome }); this.nickname = nome; },
      ...opcoes
    };
    membros.set(id, m);
    return m;
  }
  function interacao(opcoes = {}) {
    return {
      guildId: guild.id, guild, user: { tag: 'Administrador' }, deferred: false,
      memberPermissions: new PermissionsBitField([PermissionFlagsBits.Administrator]),
      async deferReply() { this.deferred = true; },
      async reply(resposta) { chamadas.respostas.push(resposta); },
      async editReply(resposta) { chamadas.resultados.push(resposta); },
      ...opcoes
    };
  }
  return { guild, cargo, membros, membro, interacao, chamadas };
}

test('servidor novo, prefixo original e permissão de administrador no comando', () => {
  assert.equal(CONFIG_BOT.ID_SERVIDOR, '1360772568436576536');
  assert.equal(CONFIG_BOT.PREFIXO_NOME, 'Cidadão. ');
  assert.equal(revisar.data.toJSON().default_member_permissions, '8');
});

test('validação exige token e ID Cidadão, sem trocar por um cargo militar', () => {
  process.env.TOKEN = '';
  assert.throws(() => validarAmbiente(), /TOKEN/);
  process.env.TOKEN = 'teste-sem-conexao';
  const salvo = CONFIG_BOT.ID_CARGO_ALVO;
  CONFIG_BOT.ID_CARGO_ALVO = '';
  assert.throws(() => validarAmbiente(), /CARGO_ALVO/);
  CONFIG_BOT.ID_CARGO_ALVO = salvo;
  assert.doesNotThrow(() => validarAmbiente());
});

test('nome de exibição, fallback para username e limite de 32 caracteres mantidos', () => {
  const c = contexto();
  const m = c.membro('humano');
  assert.equal(nomeCidadao(m), 'Cidadão. Nome de Exibição');
  m.user.globalName = null;
  assert.equal(nomeCidadao(m), 'Cidadão. usuario');
  m.user.username = 'A'.repeat(60);
  assert.equal(nomeCidadao(m).length, 32);
});

test('sem administrador ou em outro servidor não busca nem altera membros', async () => {
  const c = contexto();
  c.membro('humano');
  await revisar.execute(c.interacao({ memberPermissions: new PermissionsBitField() }));
  await revisar.execute(c.interacao({ guildId: 'outro-servidor' }));
  assert.equal(c.chamadas.buscas, 0);
  assert.equal(c.chamadas.cargos.length, 0);
  assert.match(c.chamadas.respostas[0].content, /administradores/);
  assert.match(c.chamadas.respostas[1].content, /servidor configurado/);
});

test('revisão mantém a limpeza original, ignora bots/dono/hierarquia e não repete mudanças', async () => {
  const c = contexto();
  c.membro('humano');
  const bot = c.membro('bot'); bot.user.bot = true;
  c.membro(c.guild.ownerId);
  c.membro('hierarquia-alta', { manageable: false });
  await revisar.execute(c.interacao());
  assert.deepEqual(c.chamadas.cargos, [{ id: 'humano', ids: [c.cargo.id] }]);
  assert.deepEqual(c.chamadas.nomes, [{ id: 'humano', nome: 'Cidadão. Nome de Exibição' }]);
  let campos = c.chamadas.resultados[0].embeds[0].toJSON().fields;
  assert.equal(campos[0].value, '1');
  assert.equal(campos[1].value, '1');
  await revisar.execute(c.interacao());
  assert.equal(c.chamadas.cargos.length, 1);
  assert.equal(c.chamadas.nomes.length, 1);
  campos = c.chamadas.resultados[1].embeds[0].toJSON().fields;
  assert.equal(campos[0].value, '0');
});

test('cargo fora da hierarquia impede a revisão antes de alterar qualquer membro', async t => {
  t.mock.method(console, 'error', () => {});
  const c = contexto();
  c.membro('humano');
  c.cargo.editable = false;
  await revisar.execute(c.interacao());
  assert.equal(c.chamadas.buscas, 0);
  assert.equal(c.chamadas.cargos.length, 0);
  assert.match(c.chamadas.resultados[0].content, /acima do cargo Cidadão/);
});

test('duas revisões simultâneas não limpam o servidor duas vezes', async () => {
  const c = contexto();
  c.membro('humano');
  await Promise.all([revisar.execute(c.interacao()), revisar.execute(c.interacao())]);
  assert.equal(c.chamadas.buscas, 1);
  assert.equal(c.chamadas.cargos.length, 1);
  assert.match(c.chamadas.respostas[0].content, /em andamento/);
});

test('falha de alteração é contabilizada, sem anunciar membro atualizado', async t => {
  t.mock.method(console, 'error', () => {});
  const c = contexto();
  const m = c.membro('humano');
  m.roles.set = async () => { throw new Error('Acesso negado'); };
  await revisar.execute(c.interacao());
  const campos = c.chamadas.resultados[0].embeds[0].toJSON().fields;
  assert.equal(campos[0].value, '0');
  assert.equal(campos[1].value, '1');
  assert.equal(c.chamadas.nomes.length, 0);
});

test('entrada adiciona cargo e apelido sem limpar cargos; ignora bots e outros servidores', async t => {
  t.mock.method(console, 'log', () => {});
  const c = contexto();
  let evento;
  entrada({ on(nome, fn) { assert.equal(nome, Events.GuildMemberAdd); evento = fn; } });
  const m = c.membro('humano');
  await evento(m);
  assert.deepEqual(c.chamadas.adicionados, [{ id: 'humano', roleId: c.cargo.id }]);
  assert.equal(c.chamadas.cargos.length, 0);
  assert.deepEqual(c.chamadas.nomes, [{ id: 'humano', nome: 'Cidadão. Nome de Exibição' }]);
  m.user.bot = true;
  await evento(m);
  m.user.bot = false;
  m.guild = { id: 'outro-servidor' };
  await evento(m);
  assert.equal(c.chamadas.adicionados.length, 1);
});

test('módulos podem ser importados sem tentar login ou registrar comandos', () => {
  assert.equal(typeof require('../src/index').iniciar, 'function');
  assert.equal(typeof require('../src/deploy-commands').registrarComandos, 'function');
  assert.equal(typeof require('../src/events/guildMemberUpdate'), 'function');
});
