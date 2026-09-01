import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
} from 'discord.js';

export const TICKET_PANEL_IMAGE_URL = 'https://media.discordapp.net/attachments/1524161046447919164/1539711576960139304/BannerBase5_4.png?ex=6a874fa6&is=6a85fe26&hm=cf31d65588735af57c7f8040cd1ad9f5a7043863d21b64c7960b379c245a6205&=&format=webp&quality=lossless';
export const VERIFICATION_PANEL_IMAGE_URL = 'https://media.discordapp.net/attachments/1524161046447919164/1540235334992789594/banner.ver.png?ex=6a893770&is=6a87e5f0&hm=5ef54b459f60c4f7c0cbd08b649a1cb4b91c9348b6244b1dd190e3c051f9e438&=&format=webp&quality=lossless&width=1280&height=428';

export function createTicketPanelComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_type_select')
    .setPlaceholder('Select a ticket type')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('General Support')
        .setValue('general')
        .setDescription('Questions, help, and account issues'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Internal Affairs Support')
        .setValue('internal_affairs')
        .setDescription('Requests for internal affairs assistance'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Management Support')
        .setValue('management')
        .setDescription('Requests that need management assistance'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Partnership Support')
        .setValue('partnership')
        .setDescription('Partnership questions and requests')
    );

  const panel = new ContainerBuilder()
    .setAccentColor(0xFFFFFF)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(TICKET_PANEL_IMAGE_URL))
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Support Tickets')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Welcome to Miami City Roleplay Support**\n\nNeed help? We\'re here for you.\n\nChoose the category below that best matches your issue to create a ticket. Our support team will respond as soon as possible.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing('Large'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(select));

  return [panel];
}

export function createVerificationPanelComponents() {
  const verifyButton = new ButtonBuilder()
    .setCustomId('verify_bloxlink')
    .setLabel('Verify')
    .setStyle(ButtonStyle.Secondary);

  const panel = new ContainerBuilder()
    .setAccentColor(0xFFFFFF)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(VERIFICATION_PANEL_IMAGE_URL))
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('# Verification')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing('Small'))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Verify your Roblox account**\n\nClick the button below to verify through Bloxlink. Once verified, your Discord nickname will be updated to your Roblox username.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing('Large'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(verifyButton));

  return [panel];
}

export function createTicketBannerComponents() {
  return [
    new ContainerBuilder()
      .setAccentColor(0xFFFFFF)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(TICKET_PANEL_IMAGE_URL))
      ),
  ];
}

export function createClaimActionRow({ claimedBy = null, userId = null } = {}) {
  const isClaimed = Boolean(claimedBy);
  const canUnclaim = !isClaimed || claimedBy === userId;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('toggle_claim_ticket')
      .setLabel(isClaimed ? 'Unclaim' : 'Claim')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isClaimed && !canUnclaim)
  );
}
