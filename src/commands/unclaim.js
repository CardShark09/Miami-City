import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';
import { createUnclaimNotificationEmbed, updateTicketTopEmbedWithButtons } from '../utilities/embeds.js';

export async function handleUnclaimCommand(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) return;

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.reply({ content: 'This command can only be used inside a ticket channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!metadata.claimedBy) {
    await interaction.reply({ content: 'You have not claimed this ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (metadata.claimedBy !== interaction.user.id && !member.roles.cache.has(config.supportRoleId)) {
    await interaction.reply({ content: 'You can only unclaim a ticket you claimed or be a member of support.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({ content: `You have unclaimed ticket ${metadata.ticketId}.`, flags: MessageFlags.Ephemeral });

  metadata.claimedBy = null;
  syncTicketMetadata(ticketChannel.id, metadata);

  // Send unclaim notification embed
  const unclaimEmbed = createUnclaimNotificationEmbed({
    userId: interaction.user.id,
    username: interaction.user.username,
  });
  await ticketChannel.send({ embeds: [unclaimEmbed], allowedMentions: { parse: [] } });

  try {
    const openerMessageId = metadata.openerMessageId;
    if (!openerMessageId) {
      throw new Error('Opening message not found.');
    }

    const openerMessage = await ticketChannel.messages.fetch(openerMessageId);
    const payload = updateTicketTopEmbedWithButtons(openerMessage, null, interaction.user.id);
    if (!payload) {
      throw new Error('Opening message could not be updated.');
    }

    await openerMessage.edit(payload);
  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
