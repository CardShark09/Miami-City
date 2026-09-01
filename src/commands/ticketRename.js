import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata } from '../utilities/ticketStore.js';

export async function handleTicketRenameCommand(interaction) {
  // Defer reply immediately to avoid 3-second timeout
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) return;

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.editReply({ content: 'This command can only be used inside a ticket channel.' });
    return;
  }

  const hasSupportRole = member.roles.cache.has(config.supportRoleId);
  if (!hasSupportRole) {
    await interaction.editReply({ content: 'You need the support role to rename tickets.' });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.editReply({ content: 'This channel does not appear to be a tracked ticket.' });
    return;
  }

  try {
    const currentName = ticketChannel.name;
    const hasGreenDot = currentName.includes('🟢');
    const hasRedDot = currentName.includes('🔴');

    const targetName = hasGreenDot
      ? `🔴-${String(metadata.ticketType ?? 'ticket').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-unclaimed`
      : `🟢-claimed-${String(interaction.user.username ?? 'user').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;

    if (currentName !== targetName) {
      await ticketChannel.edit({ name: targetName.slice(0, 100) });
    }

    await interaction.editReply({
      content: hasGreenDot
        ? `Ticket renamed to: ${targetName}`
        : `Ticket renamed to: ${targetName.slice(0, 100)}`,
    });
  } catch (error) {
    console.error('Error renaming ticket:', error);
    await interaction.editReply({ content: 'Failed to rename the ticket.' });
  }
}
