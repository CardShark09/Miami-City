import { PermissionsBitField, MessageFlags } from 'discord.js';
import { createTicketStatusEmbed } from '../utilities/embeds.js';
import { getTicketById } from '../utilities/ticketStore.js';

export async function handleLookupCommand(interaction) {
  // Defer reply immediately to avoid 3-second timeout
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Check if user has administrator permissions
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.editReply({ content: 'You need administrator permissions to use this command.' });
    return;
  }

  const ticketId = interaction.options.getString('ticketid');

  if (!ticketId) {
    await interaction.editReply({ content: 'Please provide a ticket ID to look up.' });
    return;
  }

  const metadata = getTicketById(ticketId);
  if (!metadata) {
    await interaction.editReply({ content: `No ticket was found for ID ${ticketId}.` });
    return;
  }

  const createdDate = new Date(metadata.createdAt).toLocaleString();
  const closedDate = metadata.closedAt ? new Date(metadata.closedAt).toLocaleString() : 'Not closed';
  const closedBy = metadata.closedBy ? `<@${metadata.closedBy}>` : 'N/A';

  const embed = createTicketStatusEmbed({
    title: '🔎 Ticket Lookup',
    description: `Detailed information for ticket ${ticketId}.`,
    ticketId,
    channelId: metadata.channelId,
    claimedBy: metadata.claimedBy ? `<@${metadata.claimedBy}>` : 'Unclaimed',
  });

  // Add custom fields for extended info
  embed
    .addFields(
      { name: '**Ticket Type**', value: `> ${metadata.ticketType}`, inline: true },
      { name: '**Opened By**', value: `> <@${metadata.ownerId}>`, inline: true },
      { name: '**Opened At**', value: `> ${createdDate}`, inline: true },
      { name: '**Closed At**', value: `> ${closedDate}`, inline: true },
      { name: '**Closed By**', value: `> ${closedBy}`, inline: true }
    );

  await interaction.editReply({ embeds: [embed] });
}
