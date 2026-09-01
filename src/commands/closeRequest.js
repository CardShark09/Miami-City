import { MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';
import { createCloseRequestEmbed, embedToV2Components } from '../utilities/embeds.js';

export async function handleCloseRequestCommand(interaction) {
  const member = interaction.member;

  if (!member) return;

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

  if (metadata.ownerId !== interaction.user.id && !member.roles.cache.has(config.supportRoleId)) {
    await interaction.reply({ content: 'Only the ticket owner or support can request to close this ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  const closeButton = new ButtonBuilder()
    .setCustomId('confirm_close_ticket_request')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_close_ticket_request')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  const actionRow = new ActionRowBuilder().addComponents(closeButton, cancelButton);

  const reason = interaction.options.getString('reason');
  metadata.closeReason = reason;
  syncTicketMetadata(ticketChannel.id, metadata);
  const embed = createCloseRequestEmbed({ requesterId: interaction.user.id, reason });

  await ticketChannel.send({
    content: `<@${metadata.ownerId}>`,
  });

  await ticketChannel.send({
    components: [...embedToV2Components(embed), actionRow],
    flags: MessageFlags.IsComponentsV2,
  });

  await interaction.reply({ content: 'Close request sent.', flags: MessageFlags.Ephemeral });
}
