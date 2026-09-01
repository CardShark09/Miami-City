import { PermissionFlagsBits, MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';
import { createClaimNotificationEmbed, updateTicketTopEmbedWithButtons } from '../utilities/embeds.js';

export async function handleClaimCommand(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) return;

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.reply({ content: 'This command can only be used inside a ticket channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  const hasSupportRole = member.roles.cache.has(config.supportRoleId);
  if (!hasSupportRole) {
    await interaction.reply({ content: 'You need the support role to claim tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (metadata.claimedBy) {
    await interaction.reply({ content: `<@${metadata.claimedBy}> has already **claimed** this ticket!`, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({ content: `You have claimed ticket ${metadata.ticketId}.`, flags: MessageFlags.Ephemeral });

  metadata.claimedBy = interaction.user.id;
  if (!metadata.originalChannelName) {
    metadata.originalChannelName = ticketChannel.name;
  }
  syncTicketMetadata(ticketChannel.id, metadata);

  // Send claim notification embed
  const claimEmbed = createClaimNotificationEmbed({
    userId: interaction.user.id,
    username: interaction.user.username,
  });
  await ticketChannel.send({ embeds: [claimEmbed], allowedMentions: { parse: [] } });

  try {
    const openerMessageId = metadata.openerMessageId;
    if (!openerMessageId) {
      throw new Error('Opening message not found.');
    }

    const openerMessage = await ticketChannel.messages.fetch(openerMessageId);
    const payload = updateTicketTopEmbedWithButtons(openerMessage, metadata.claimedBy, interaction.user.id);
    if (!payload) {
      throw new Error('Opening message could not be updated.');
    }

    await openerMessage.edit(payload);
  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
