import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';
import { createForceUnclaimNotificationEmbed, updateTicketTopEmbedWithButtons } from '../utilities/embeds.js';

export async function handleForceUnclaimCommand(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) return;

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.reply({ content: 'This command can only be used inside a ticket channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!member.roles.cache.has(config.highRankRoleId)) {
    await interaction.reply({ content: 'You do not have permission to force-unclaim tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!metadata.claimedBy) {
    await interaction.reply({ content: 'No one has claimed this ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.reply({ content: `You have force-unclaimed ticket ${metadata.ticketId}.`, flags: MessageFlags.Ephemeral });

  metadata.claimedBy = null;
  syncTicketMetadata(ticketChannel.id, metadata);

  // Find and edit the first embed message to update claimed by field and button
  try {
    const messages = await ticketChannel.messages.fetch({ limit: 10 });
    const embedMessage = messages.find(
      (msg) =>
        msg.author.id === guild.client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].fields?.length > 0
    );

    if (embedMessage) {
      const payload = updateTicketTopEmbedWithButtons(embedMessage, null, interaction.user.id);
      if (payload) {
        await embedMessage.edit(payload);
      }
    }
  } catch (error) {
    console.error('Error updating embed:', error);
  }

  await ticketChannel.send({
    embeds: [createForceUnclaimNotificationEmbed({ userId: interaction.user.id })],
    allowedMentions: { parse: [] },
  });
}
