import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata } from '../utilities/ticketStore.js';
import { createTicketMemberUpdateEmbed, embedToV2Components } from '../utilities/embeds.js';

export async function handleTicketAddCommand(interaction) {
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
    await interaction.reply({ content: 'You need the support role to add users to tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const targetUser = interaction.options?.getUser('user');
  if (!targetUser) {
    await interaction.reply({ content: 'Please specify a user to add.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await ticketChannel.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true });

    await interaction.reply({ content: `<@${targetUser.id}> has been added to the ticket.`, flags: MessageFlags.Ephemeral });
    const embed = createTicketMemberUpdateEmbed({ action: 'add', targetUserId: targetUser.id, actorUserId: interaction.user.id });
    await ticketChannel.send({
      components: embedToV2Components(embed),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error('Error adding user:', error);
    await interaction.reply({ content: 'Failed to add the user to the ticket.', flags: MessageFlags.Ephemeral });
  }
}
