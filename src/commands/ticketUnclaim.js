import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';
import { createTicketStatusEmbed } from '../utilities/embeds.js';

export async function handleTicketUnclaimCommand(interaction) {
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
    await interaction.reply({ content: 'You need the support role to unclaim tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!metadata.claimedBy) {
    await interaction.reply({ content: 'This ticket is not currently claimed.', flags: MessageFlags.Ephemeral });
    return;
  }

  metadata.claimedBy = null;
  syncTicketMetadata(ticketChannel.id, metadata);

  const embed = createTicketStatusEmbed({
    title: '🎫 Ticket Unclaimed',
    description: `<@${interaction.user.id}> has unclaimed this ticket.`,
    ticketId: metadata.ticketId,
    channelId: ticketChannel.id,
    claimedBy: 'Unclaimed',
  });

  await ticketChannel.send({ embeds: [embed] });

  await interaction.reply({ content: `Ticket ${metadata.ticketId} has been unclaimed.`, flags: MessageFlags.Ephemeral });
}
