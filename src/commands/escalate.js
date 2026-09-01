import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { createTicketStatusEmbed, embedToV2Components } from '../utilities/embeds.js';
import { getTicketMetadata, syncTicketMetadata } from '../utilities/ticketStore.js';

export async function handleEscalateCommand(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member) return;

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.reply({ content: 'This command can only be used inside a ticket channel.', ephemeral: true });
    return;
  }

  const hasSupportRole = member.roles.cache.has(config.supportRoleId);
  if (!hasSupportRole) {
    await interaction.reply({ content: 'You need the support role to escalate tickets.', ephemeral: true });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', ephemeral: true });
    return;
  }

  metadata.escalated = !metadata.escalated;
  syncTicketMetadata(ticketChannel.id, metadata);

  const embed = createTicketStatusEmbed({
    title: metadata.escalated ? '⚠️ Ticket Escalated' : '✅ Ticket De-Escalated',
    description: metadata.escalated
      ? 'This ticket has been escalated for higher-priority handling.'
      : 'This ticket is no longer escalated.',
    ticketId: metadata.ticketId,
    channelId: ticketChannel.id,
    claimedBy: metadata.claimedBy ? `<@${metadata.claimedBy}>` : 'Unclaimed',
  });

  await ticketChannel.send({
    components: embedToV2Components(embed),
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
  await interaction.reply({ content: `Ticket ${metadata.ticketId} has been ${metadata.escalated ? 'escalated' : 'de-escalated'}.`, ephemeral: true });
}
