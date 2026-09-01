import { MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata } from '../utilities/ticketStore.js';
import { createTicketMemberUpdateEmbed, embedToV2Components } from '../utilities/embeds.js';

export async function handleTicketRemoveCommand(interaction) {
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
    await interaction.reply({ content: 'You need the support role to remove users from tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const targetUser = interaction.options?.getUser('user');
  if (!targetUser) {
    await interaction.reply({ content: 'Please specify a user to remove.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await ticketChannel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: false,
      SendMessages: false,
      ReadMessageHistory: false,
    });

    await interaction.reply({ content: `<@${targetUser.id}> has been removed from the ticket.`, flags: MessageFlags.Ephemeral });
    const embed = createTicketMemberUpdateEmbed({ action: 'remove', targetUserId: targetUser.id, actorUserId: interaction.user.id });
    await ticketChannel.send({
      components: embedToV2Components(embed),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error('Error removing user:', error);
    await interaction.reply({ content: 'Failed to remove the user from the ticket.', flags: MessageFlags.Ephemeral });
  }
}
