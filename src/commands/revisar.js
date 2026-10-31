'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { CONFIG_BOT, nomeCidadao } = require('../config');
const revisoesAtivas = new Set();

module.exports = {
  data: new SlashCommandBuilder().setName('revisar')
    .setDescription('Remove cargos dos membros e aplica o cargo e apelido de Cidadão.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.guildId !== CONFIG_BOT.ID_SERVIDOR) {
      return interaction.reply({ content: 'Este bot atende somente ao servidor configurado.', flags: MessageFlags.Ephemeral });
    }
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Apenas administradores podem executar /revisar.', flags: MessageFlags.Ephemeral });
    }
    if (revisoesAtivas.has(interaction.guildId)) {
      return interaction.reply({ content: 'Já há uma revisão em andamento. Aguarde a conclusão.', flags: MessageFlags.Ephemeral });
    }
    revisoesAtivas.add(interaction.guildId);
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const cargo = await interaction.guild.roles.fetch(CONFIG_BOT.ID_CARGO_ALVO);
      if (!cargo) throw new Error('O cargo definido em CARGO_ALVO não foi encontrado neste servidor.');
      if (!cargo.editable) throw new Error('Coloque o cargo do bot acima do cargo Cidadão e permita Gerenciar cargos.');
      const bot = await interaction.guild.members.fetchMe();
      if (!bot.permissions.has([PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageNicknames])) {
        throw new Error('O bot precisa das permissões Gerenciar cargos e Gerenciar apelidos.');
      }
      const members = await interaction.guild.members.fetch();
      let alterados = 0;
      let erros = 0;
      for (const member of members.values()) {
        if (member.user.bot || member.id === interaction.guild.ownerId) continue;
        if (!member.manageable) { erros++; continue; }
        try {
          let modificou = false;
          const cargosAtuais = member.roles.cache.filter(role => role.id !== interaction.guild.id);
          const temApenasOCargoAlvo = cargosAtuais.size === 1 && cargosAtuais.has(cargo.id);
          if (!temApenasOCargoAlvo) {
            // Mantém o comportamento original: limpa cargos e deixa Cidadão.
            await member.roles.set([cargo.id], `Revisão solicitada por ${interaction.user.tag}`);
            modificou = true;
          }
          const novoNome = nomeCidadao(member);
          if (member.nickname !== novoNome) {
            await member.setNickname(novoNome, `Revisão solicitada por ${interaction.user.tag}`);
            modificou = true;
          }
          if (modificou) alterados++;
        } catch (error) {
          erros++;
          console.error(`Não foi possível concluir a revisão do membro ${member.id}:`, error.message);
        }
      }
      const embed = new EmbedBuilder().setColor('#00FF00')
        .setTitle('🛠️ Revisão de Membros Concluída')
        .setDescription('O processo de formatação automatizada de quem já estava no servidor foi terminado.')
        .addFields(
          { name: '✅ Membros Atualizados/Limpos', value: `${alterados}`, inline: true },
          { name: '⚠️ Falhas ou Hierarquia Alta', value: `${erros}`, inline: true }
        ).setTimestamp().setFooter({ text: `Solicitado por: ${interaction.user.tag}` });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro durante a revisão:', error.message);
      const resposta = { content: `❌ ${error.message}`, allowedMentions: { parse: [] } };
      if (interaction.deferred) await interaction.editReply(resposta);
      else await interaction.reply({ ...resposta, flags: MessageFlags.Ephemeral });
    } finally {
      revisoesAtivas.delete(interaction.guildId);
    }
  }
};
