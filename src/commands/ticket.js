import { ChannelType, MessageFlags } from 'discord.js';
import { config } from '../utilities/config.js';
import { createTicketLogEmbed, createTicketOpeningV2Container, createTicketActionRow, embedToV2Components } from '../utilities/embeds.js';
import { createTicketMetadata, getOpenTicketsForOwner, syncTicketMetadata } from '../utilities/ticketStore.js';
import { getSupportCategoryId, getSupportType } from '../utilities/supportTypes.js';

function sanitizeTicketName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function replyToInteraction(interaction, payload) {
  const normalizedPayload = {
    ...payload,
    ...(payload.ephemeral ? { flags: 64 } : {}),
  };

  delete normalizedPayload.ephemeral;

  // If deferred, use editReply
  if (interaction.deferred) {
    return interaction.editReply(normalizedPayload);
  }

  // If replied, use followUp
  if (interaction.replied) {
    return interaction.followUp(normalizedPayload);
  }

  // For string select menus, use followUp since they need to defer first
  if (interaction.isStringSelectMenu()) {
    return interaction.followUp(normalizedPayload);
  }

  if (typeof interaction.reply === 'function') {
    return interaction.reply(normalizedPayload);
  }

  return interaction.channel.send(normalizedPayload);
}

export async function getBloxlinkRobloxInfo(guildId, userId) {
  if (!config.bloxlinkApiKey) {
    return { isVerified: false, status: 'User is not verified.', profileUrl: null, robloxUsername: null };
  }

  try {
    const response = await fetch(`https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${userId}`, {
      headers: {
        Authorization: config.bloxlinkApiKey,
      },
    });

    if (!response.ok) {
      return { isVerified: false, status: 'User is not verified.', profileUrl: null, robloxUsername: null };
    }

    const data = await response.json();
    const robloxId = data?.robloxID;

    if (!robloxId) {
      return { isVerified: false, status: 'User is not verified.', profileUrl: null, robloxUsername: null };
    }

    let robloxUsername = data?.robloxUsername ?? data?.robloxName ?? data?.username ?? null;
    if (!robloxUsername) {
      const robloxResponse = await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(robloxId)}`);
      if (robloxResponse.ok) {
        const robloxData = await robloxResponse.json();
        robloxUsername = robloxData?.name ?? null;
      }
    }

    return {
      isVerified: true,
      status: robloxUsername ?? 'Verified',
      robloxUsername,
      profileUrl: `https://www.roblox.com/users/${robloxId}/profile`,
    };
  } catch (error) {
    console.error('Error fetching Bloxlink info:', error);
    return { isVerified: false, status: 'User is not verified.', profileUrl: null, robloxUsername: null };
  }
}

export async function handleTicketCommand(interaction) {
  const guild = interaction.guild;
  if (!guild) return;

  const ticketType = interaction.options?.getString?.('type') ?? 'general';
  const customName = interaction.options?.getString?.('name');

  await openTicket({
    interaction,
    guild,
    ticketType: getSupportType(ticketType) ? ticketType : 'general',
    customName,
  });
}

export async function openTicket({ interaction, guild, ticketType, customName = null, issue = null }) {
  const supportType = getSupportType(ticketType);
  const categoryId = getSupportCategoryId(config, ticketType);

  if (!supportType || !categoryId) {
    await replyToInteraction(interaction, {
      content: 'This ticket type is not configured correctly. Please contact an administrator.',
      ephemeral: true,
    });
    return;
  }
  let category = guild.channels.cache.get(categoryId);
  
  console.log(`Opening ticket type: ${ticketType}, categoryId: ${categoryId}`);
  
  // If not in cache, try to fetch it
  if (!category) {
    try {
      category = await guild.channels.fetch(categoryId);
    } catch (error) {
      console.error(`Failed to fetch category ${categoryId}: ${error.message}`);
    }
  }

  const supportRole = guild.roles.cache.get(config.supportRoleId);

  if (!category) {
    console.log(`Category ${categoryId} not found`);
    await replyToInteraction(interaction, { content: `The ticket category for ${ticketType} (ID: ${categoryId}) could not be found.`, ephemeral: true });
    return;
  }

  if (category.type !== ChannelType.GuildCategory) {
    console.log(`Category ${categoryId} is type ${category.type}, expected ${ChannelType.GuildCategory}`);
    await replyToInteraction(interaction, { content: `Channel ${categoryId} is not a category.`, ephemeral: true });
    return;
  }

  if (!supportRole) {
    await replyToInteraction(interaction, { content: 'The support role is not configured correctly.', ephemeral: true });
    return;
  }

  const activeTickets = getOpenTicketsForOwner(interaction.user.id);
  if (activeTickets.length >= 3) {
    await replyToInteraction(interaction, {
      content: 'You already have 3 active tickets open. Please close or resolve one before opening another.',
      ephemeral: true,
    });
    return;
  }

  const requestedName = customName
    ? sanitizeTicketName(customName)
    : `${sanitizeTicketName(interaction.user.username)}-${ticketType}`;
  const channelName = requestedName;

  const existingTicket = guild.channels.cache.find(
    (channel) => channel.isTextBased() && channel.name === channelName
  );

  if (existingTicket) {
    await replyToInteraction(interaction, {
      content: `You already have a ticket open: <#${existingTicket.id}>`,
      ephemeral: true,
    });
    return;
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
  });

  // Inherit the category's access rules, then explicitly grant the ticket opener access.
  await ticketChannel.lockPermissions();
  await ticketChannel.permissionOverwrites.edit(interaction.user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  const metadata = createTicketMetadata({
    ticketType,
    ownerId: interaction.user.id,
    channelId: ticketChannel.id,
  });

  const openerDisplayName = interaction.member?.displayName ?? interaction.user.username;

  const bloxlinkInfo = await getBloxlinkRobloxInfo(guild.id, interaction.user.id);

  const openingContainer = createTicketOpeningV2Container({
    ticketType: supportType.label,
    ticketId: metadata.ticketId,
    userId: interaction.user.id,
    openerDisplayName,
    claimedBy: metadata.claimedBy,
    supportType: supportType.label,
    bloxlinkStatus: bloxlinkInfo.status,
    bloxlinkProfileUrl: bloxlinkInfo.profileUrl,
    ticketNotes: issue,
  });

  await ticketChannel.send({
    content: `<@${interaction.user.id}> <@&${config.openerPingRoleId}>`,
  });

  const openerMessage = await ticketChannel.send({
    components: [openingContainer, createTicketActionRow({ claimedBy: metadata.claimedBy, userId: interaction.user.id })],
    flags: MessageFlags.IsComponentsV2,
  });

  syncTicketMetadata(ticketChannel.id, { ...metadata, openerMessageId: openerMessage.id, originalChannelName: channelName });

  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (logChannel && logChannel.isTextBased()) {
    await logChannel.send({
      components: embedToV2Components(
        createTicketLogEmbed({
          title: '📌 Ticket Opened',
          description: `A new ${supportType.label} ticket was created by <@${interaction.user.id}>.`,
          ticketId: metadata.ticketId,
          userId: interaction.user.id,
          channelId: ticketChannel.id,
        })
      ),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  }

  await replyToInteraction(interaction, { content: `Your ticket has been created: <#${ticketChannel.id}>`, ephemeral: true });
}
