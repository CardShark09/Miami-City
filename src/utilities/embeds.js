import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, TextDisplayBuilder, SeparatorBuilder } from 'discord.js';
import { config } from './config.js';
import { TICKET_PANEL_IMAGE_URL } from './panel.js';

const SERVER_NAME = 'Miami City Roleplay';
const FOOTER_ICON_URL = config.brandImageUrl;
export const BOTTOM_EMBED_IMAGE_URL = 'https://media.discordapp.net/attachments/1524161046447919164/1539789242815877160/image.png?ex=6a88e97b&is=6a8797fb&hm=80f2eeef19ae980e49d06fc44ca0bdfc4115e9ab1b3cfb95d15b4adc920ba22e&=&format=webp&quality=lossless';

export function addBrandImage(embed) {
  return embed.setImage(BOTTOM_EMBED_IMAGE_URL);
}

function decorateFields(fields = []) {
  return fields.map((field) => ({
    name: `**${field.name}**`,
    value: `> ${field.value}`,
    inline: field.inline ?? false,
  }));
}

export function createSupportEmbed({
  title,
  description,
  fields = [],
  color = 0xFFFFFF,
  serverName = SERVER_NAME,
  footerText = 'Ticket System',
  footerIconUrl = null,
}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description)
    .setFooter(footerIconUrl ? { text: footerText, iconURL: footerIconUrl } : { text: footerText })
    .setTimestamp();

  if (title) {
    embed.setTitle(title);
  }

  if (fields.length > 0) {
    embed.addFields(decorateFields(fields));
  }

  return addBrandImage(embed);
}

function buildV2TextBlocks(embedLike) {
  const blocks = [];

  if (embedLike.title) {
    blocks.push(new TextDisplayBuilder().setContent(`# ${embedLike.title}`));
  }

  if (embedLike.description) {
    blocks.push(new TextDisplayBuilder().setContent(embedLike.description));
  }

  if (embedLike.fields?.length) {
    const fieldText = embedLike.fields
      .map((field) => `**${field.name.replace(/^\*\*|\*\*$/g, '')}**\n${field.value}`)
      .join('\n\n');
    blocks.push(new TextDisplayBuilder().setContent(fieldText));
  }

  if (embedLike.footer?.text) {
    blocks.push(new TextDisplayBuilder().setContent(`**${embedLike.footer.text}**`));
  }

  return blocks;
}

export function embedToV2Components(embed) {
  const embedLike = typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
  const container = new ContainerBuilder().setAccentColor(embedLike.color ?? 0xffffff);
  const blocks = buildV2TextBlocks(embedLike);

  blocks.forEach((block, index) => {
    container.addTextDisplayComponents(block);
    if (index < blocks.length - 1) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));
    }
  });

  if (embedLike.image?.url) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(embedLike.image.url))
    );
  }

  return [container];
}

export function createV2MessageContainer({ preface = null, embed }) {
  const embedLike = typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
  const container = new ContainerBuilder().setAccentColor(embedLike.color ?? 0xffffff);

  if (preface) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(preface));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));
  }

  buildV2TextBlocks(embedLike).forEach((block, index, blocks) => {
    container.addTextDisplayComponents(block);
    if (index < blocks.length - 1) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));
    }
  });

  if (embedLike.image?.url) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(embedLike.image.url))
    );
  }

  return container;
}

export function createTicketOpeningEmbed({ channel, ticketType, ticketId, userId, openerDisplayName = null, claimedBy = null, claimedByDisplayName = null, supportType = 'Support', bloxlinkStatus = 'User is not verified.', bloxlinkProfileUrl = null, ticketNotes = null }) {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US');

  return createSupportEmbed({
    title: `${ticketType} Ticket`,
    description: `A new **${ticketType} ticket** has been opened for <@${userId}>. Please explain below with what we can assist you with.`,
    fields: [
      { name: 'User', value: `<@${userId}>` },
      { name: 'Ticket ID', value: `${ticketId}` },
      { name: 'Inquiry', value: ticketNotes || 'No notes were provided.' },
      { name: 'Claimed By', value: claimedBy ? `<@${claimedBy}>` : 'Unclaimed' },
      { name: 'TIcket Opener Info:', value: `Roblox: ${bloxlinkStatus}\n> Link: ${bloxlinkProfileUrl ?? 'Profile not found.'}` },
    ],
    color: 0xFFFFFF,
    footerText: `${SERVER_NAME} ${dateString}`,
  });
}

export function createTicketOpeningV2Container({
  preface = null,
  ticketType,
  ticketId,
  userId,
  openerDisplayName = null,
  claimedBy = null,
  claimedByDisplayName = null,
  bloxlinkStatus = 'User is not verified.',
  bloxlinkProfileUrl = null,
  ticketNotes = null,
  footerText = `${SERVER_NAME} - Trolling may result in a blacklist.`,
  footerIconUrl = FOOTER_ICON_URL,
}) {
  const embed = createSupportEmbed({
    title: `${ticketType} Ticket`,
    description: claimedBy
      ? `${claimedByDisplayName ?? claimedBy} will be assisting you today!`
      : `A new **${ticketType} ticket** has been opened for ${openerDisplayName ?? userId}. Please explain below with what we can assist you with.`,
    fields: [
      { name: 'User', value: openerDisplayName ?? userId },
      { name: 'Ticket ID', value: `${ticketId}` },
      { name: 'Inquiry', value: ticketNotes || 'No notes were provided.' },
      { name: 'Claimed By', value: claimedBy ? (claimedByDisplayName ?? claimedBy) : 'Unclaimed' },
      { name: 'TIcket Opener Info:', value: `Roblox: ${bloxlinkStatus}\n> Link: ${bloxlinkProfileUrl ?? 'Profile not found.'}` },
    ],
    color: 0xFFFFFF,
    footerText,
    footerIconUrl,
  });

  const embedLike = embed.toJSON();
  const container = new ContainerBuilder().setAccentColor(embedLike.color ?? 0xffffff);

  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(TICKET_PANEL_IMAGE_URL))
  );
  container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));

  if (preface) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(preface));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));
  }

  buildV2TextBlocks({ ...embedLike, image: null }).forEach((block, index, blocks) => {
    container.addTextDisplayComponents(block);
    if (index < blocks.length - 1) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'));
    }
  });

  return container;
}

export function updateTicketClaimStateV2Container({
  ticketType,
  ticketId,
  userId,
  openerDisplayName = null,
  claimedBy = null,
  claimedByDisplayName = null,
  bloxlinkStatus = 'User is not verified.',
  bloxlinkProfileUrl = null,
  footerText = `${SERVER_NAME} - Trolling may result in a blacklist.`,
  footerIconUrl = FOOTER_ICON_URL,
}) {
  return createTicketOpeningV2Container({
    ticketType,
    ticketId,
    userId,
    openerDisplayName,
    claimedBy,
    claimedByDisplayName,
    bloxlinkStatus,
    bloxlinkProfileUrl,
    footerText,
    footerIconUrl,
  });
}

export function createTicketOpeningStateContainer({
  ticketType,
  ticketId,
  openerDisplayName,
  claimedBy = null,
  claimedByDisplayName = null,
  bloxlinkStatus = 'User is not verified.',
  bloxlinkProfileUrl = null,
  footerText = `${SERVER_NAME} - Trolling may result in a blacklist.`,
  footerIconUrl = FOOTER_ICON_URL,
}) {
  return createV2MessageContainer({
    embed: createSupportEmbed({
      title: `${ticketType} Ticket`,
      description: claimedBy
        ? `${claimedByDisplayName ?? claimedBy} will be assisting you today!`
        : `A new **${ticketType} ticket** has been opened for ${openerDisplayName}. Please explain below with what we can assist you with.`,
      fields: [
        { name: 'User', value: openerDisplayName },
        { name: 'Ticket ID', value: `${ticketId}` },
        { name: 'Claimed By', value: claimedBy ? (claimedByDisplayName ?? claimedBy) : 'Unclaimed' },
        { name: 'TIcket Opener Info:', value: `Roblox: ${bloxlinkStatus}\n> Link: ${bloxlinkProfileUrl ?? 'Profile not found.'}` },
      ],
      color: 0xFFFFFF,
      footerText,
      footerIconUrl,
    }),
  });
}

export function createTicketStatusEmbed({ title, description, ticketId, channelId, claimedBy = 'Unclaimed' }) {
  return createSupportEmbed({
    title,
    description,
    fields: [
      { name: 'Ticket ID', value: `**${ticketId}**` },
      { name: 'Channel', value: `<#${channelId}>` },
      { name: 'Claimed By', value: claimedBy },
    ],
    color: 0xFFFFFF,
    footerText: 'Ticket Status',
  });
}

export function createTicketLogEmbed({ title, description, ticketId, userId, channelId }) {
  return createSupportEmbed({
    title,
    description,
    fields: [
      { name: 'Ticket ID', value: `**${ticketId}**` },
      { name: 'User', value: `<@${userId}>` },
      { name: 'Channel', value: `<#${channelId}>` },
    ],
    color: 0xFFFFFF,
  });
}

export function createClaimButton({ claimedBy = null, userId = null } = {}) {
  const isClaimed = Boolean(claimedBy);
  const canUnclaim = !isClaimed || claimedBy === userId;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('toggle_claim_ticket')
      .setLabel(isClaimed ? 'Unclaim' : 'Claim')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isClaimed && !canUnclaim)
  );
}

export function createClaimNotificationEmbed({ userId, username }) {
  const embed = createSupportEmbed({
    title: 'Ticket Claimed',
    description: `<@${userId}> will be assisting you today!`,
    color: 0xFFFFFF,
    footerText: SERVER_NAME,
  });

  return addBrandImage(embed);
}

export function createUnclaimNotificationEmbed({ userId, username }) {
  const embed = createSupportEmbed({
    title: 'Ticket Unclaimed',
    description: `<@${userId}> has unclaimed this ticket.`,
    color: 0xFFFFFF,
    footerText: SERVER_NAME,
  });

  return addBrandImage(embed);
}

export function createTicketMemberUpdateEmbed({ action, targetUserId, actorUserId }) {
  const isAdd = action === 'add';

  const embed = createSupportEmbed({
    title: isAdd ? 'User Added' : 'User Removed',
    description: isAdd
      ? `<@${targetUserId}> has been added to this ticket by <@${actorUserId}>.`
      : `<@${targetUserId}> has been removed from this ticket by <@${actorUserId}>.`,
    color: 0xFFFFFF,
    footerText: SERVER_NAME,
  });

  return addBrandImage(embed);
}

export function createCloseConfirmationEmbed({ cancelled = false } = {}) {
  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm_close_ticket')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_close_ticket')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  return {
    embeds: [createSupportEmbed({
      title: cancelled ? 'Ticket Closure Cancelled' : 'Confirm Ticket Closure',
      description: cancelled
        ? 'The ticket will remain open.'
        : 'Are you sure you want to close this ticket? This action cannot be undone.',
      footerText: SERVER_NAME,
      footerIconUrl: FOOTER_ICON_URL,
    })],
    components: [new ActionRowBuilder().addComponents(confirmButton, cancelButton)],
  };
}

export function createCloseRequestEmbed({ requesterId, reason = null }) {
  return createSupportEmbed({
    title: 'Close Request',
    description: `<@${requesterId}> has requested to close this ticket.`,
    fields: reason ? [{ name: 'Reason', value: reason }] : [],
    footerText: SERVER_NAME,
    footerIconUrl: FOOTER_ICON_URL,
  });
}

export function createTicketIssueEmbed({ issue }) {
  return createSupportEmbed({
    title: 'Issue Details',
    description: issue,
    footerText: SERVER_NAME,
    footerIconUrl: FOOTER_ICON_URL,
  });
}

export function createForceUnclaimNotificationEmbed({ userId }) {
  return createSupportEmbed({
    title: 'Ticket Force-Unclaimed',
    description: `<@${userId}> has force-unclaimed this ticket.`,
    footerText: SERVER_NAME,
    footerIconUrl: FOOTER_ICON_URL,
  });
}

export function createCloseCancellationEmbed({ userId }) {
  return createSupportEmbed({
    title: 'Ticket Closure Cancelled',
    description: `<@${userId}> cancelled the closure of this ticket.`,
    footerText: SERVER_NAME,
    footerIconUrl: FOOTER_ICON_URL,
  });
}

export function createTicketRatingActionRow({ ticketId, disabled = false, selectedRating = null } = {}) {
  return new ActionRowBuilder().addComponents(
    ...[1, 2, 3, 4, 5].map((rating) =>
      new ButtonBuilder()
        .setCustomId(`ticket_rating:${ticketId}:${rating}`)
        .setEmoji('⭐')
        .setLabel(`${rating} Star${rating === 1 ? '' : 's'}`)
        .setStyle(selectedRating === rating ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(disabled)
    )
  );
}

export function createTicketRatingLogEmbed({ ownerId, claimedBy, closedBy, ticketId, rating }) {
  return createSupportEmbed({
    title: 'Ticket Rating Received',
    description: `<@${ownerId}> rated ticket ${ticketId}.`,
    fields: [
      { name: 'Ticket Owner', value: `<@${ownerId}>`, inline: true },
      { name: 'Claimed By', value: claimedBy ? `<@${claimedBy}>` : 'Unclaimed', inline: true },
      { name: 'Closed By', value: closedBy ? `<@${closedBy}>` : 'Unknown', inline: true },
      { name: 'Ticket ID', value: ticketId, inline: true },
      { name: 'Rating', value: `${'⭐'.repeat(rating)} (${rating}/5)`, inline: true },
    ],
    footerText: SERVER_NAME,
    footerIconUrl: FOOTER_ICON_URL,
  });
}

export function createTicketEmbedContainer({ embed, claimedBy = null, userId = null }) {
  return { embeds: [embed], components: [createTicketActionRow({ claimedBy, userId })] };
}

export function createTicketActionRow({ claimedBy = null, userId = null } = {}) {
  const isClaimed = Boolean(claimedBy);
  const canUnclaim = !isClaimed || claimedBy === userId;

  const claimButton = new ButtonBuilder()
    .setCustomId('toggle_claim_ticket')
    .setLabel(isClaimed ? 'Unclaim' : 'Claim')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(isClaimed && !canUnclaim);

  const closeButton = new ButtonBuilder()
    .setCustomId('close_ticket')
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(claimButton, closeButton);
}

export function updateTicketTopEmbed(embedMessage, claimedBy = null, userId = null) {
  if (!embedMessage || embedMessage.embeds.length === 0) {
    return null;
  }

  const embeds = embedMessage.embeds.map((emb) => (typeof emb.toJSON === 'function' ? emb.toJSON() : emb));
  const topEmbed = embeds[0];

  if (topEmbed?.fields) {
    const claimedByFieldIndex = topEmbed.fields.findIndex((field) => field.name === '**Claimed By**');
    if (claimedByFieldIndex !== -1) {
      topEmbed.fields[claimedByFieldIndex].value = claimedBy ? `> <@${claimedBy}>` : '> Unclaimed';
    }
  }

  return {
    embeds,
  };
}

export function updateTicketTopEmbedWithButtons(embedMessage, claimedBy = null, userId = null) {
  const payload = updateTicketTopEmbed(embedMessage, claimedBy, userId);
  if (!payload) {
    const components = embedMessage?.components?.map((component) =>
      typeof component.toJSON === 'function' ? component.toJSON() : component
    );
    if (!components?.length) {
      return null;
    }

    const updateClaimedByText = (component) => {
      if (component.type === 10 && component.content?.includes('**Claimed By**')) {
        return {
          ...component,
          content: component.content.replace(
            /(\*\*Claimed By\*\*\n> )[^\n]+/,
            `$1${claimedBy ? `<@${claimedBy}>` : 'Unclaimed'}`
          ),
        };
      }

      if (component.components) {
        return { ...component, components: component.components.map(updateClaimedByText) };
      }

      return component;
    };

    return {
      components: [
        ...components.slice(0, -1).map(updateClaimedByText),
        createTicketActionRow({ claimedBy, userId }),
      ],
    };
  }

  return {
    ...payload,
    components: [createTicketActionRow({ claimedBy, userId })],
  };
}
