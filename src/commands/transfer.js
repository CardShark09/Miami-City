import { PermissionsBitField, ChannelType } from 'discord.js';
import { config } from '../utilities/config.js';
import { getSupportCategoryId, getSupportType } from '../utilities/supportTypes.js';

export async function handleTransferCommand(interaction) {
  // Defer reply immediately to avoid 3-second timeout
  await interaction.deferReply({ ephemeral: true });

  // Check if user has support role
  if (!interaction.member.roles.cache.has(config.supportRoleId)) {
    await interaction.editReply({ content: 'You need the support role to transfer tickets.' });
    return;
  }

  const ticketType = interaction.options.getString('type');
  const channel = interaction.channel;

  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({ content: 'This command can only be used in a ticket channel.' });
    return;
  }

  try {
    const guild = interaction.guild;
    const currentCategory = channel.parent;
    const currentChannelName = channel.name;

    const supportType = getSupportType(ticketType);
    const targetCategoryId = getSupportCategoryId(config, ticketType);

    if (!supportType || !targetCategoryId) {
      await interaction.editReply({ content: 'Invalid ticket type specified.' });
      return;
    }

    const targetCategory = guild.channels.cache.get(targetCategoryId);

    if (!targetCategory || targetCategory.type !== ChannelType.GuildCategory) {
      await interaction.editReply({ content: 'Target category not found or is not a category.' });
      return;
    }

    if (currentCategory.id === targetCategoryId) {
      await interaction.editReply({ content: 'Ticket is already in the target category.' });
      return;
    }

    // Get the support role
    const supportRole = guild.roles.cache.get(config.supportRoleId);

    if (!supportRole) {
      await interaction.editReply({ content: 'Support role not found.' });
      return;
    }

    const currentSuffix = currentChannelName.lastIndexOf('-');
    const usernamePart = currentSuffix > 0 ? currentChannelName.slice(0, currentSuffix) : currentChannelName;
    const newChannelName = `${usernamePart}-${ticketType}`;

    // Update channel name and move to new category
    await channel.setName(newChannelName);
    await channel.setParent(targetCategoryId);

    await interaction.editReply({
      content: `Ticket has been transferred to **${supportType.label}** and renamed to **${newChannelName}**.`,
    });
  } catch (error) {
    console.error('Error transferring ticket:', error);
    await interaction.editReply({ content: 'An error occurred while transferring the ticket.' });
  }
}
