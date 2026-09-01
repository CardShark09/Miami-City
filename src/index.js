import { Client, Events, GatewayIntentBits, MessageFlags, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { config } from './utilities/config.js';
import { openTicket } from './commands/ticket.js';
import { handleClaimCommand } from './commands/claim.js';
import { handleUnclaimCommand } from './commands/unclaim.js';
import { handleForceUnclaimCommand } from './commands/forceUnclaim.js';
import { handleLookupCommand } from './commands/lookup.js';
import { handleTransferCommand } from './commands/transfer.js';
import { handleTicketRenameCommand } from './commands/ticketRename.js';
import { handleCloseRequestCommand } from './commands/closeRequest.js';
import { handleTicketStatusCommand } from './commands/ticketStatus.js';
import { handleTicketRemoveCommand } from './commands/ticketRemove.js';
import { handleTicketUnclaimCommand } from './commands/ticketUnclaim.js';
import { handleTicketAddCommand } from './commands/ticketAdd.js';
import { handleTicketCloseCommand } from './commands/ticketClose.js';
import { addBrandImage, createCloseCancellationEmbed, createCloseConfirmationEmbed, createClaimNotificationEmbed, createTicketRatingActionRow, createTicketRatingLogEmbed, createUnclaimNotificationEmbed, embedToV2Components, updateTicketTopEmbed, updateTicketTopEmbedWithButtons } from './utilities/embeds.js';
import { createTicketPanelComponents, createVerificationPanelComponents } from './utilities/panel.js';
import { getBloxlinkRobloxInfo } from './commands/ticket.js';
import { getTicketById, getTicketMetadata, syncTicketMetadata, saveTranscript, initializeStore } from './utilities/ticketStore.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel, Partials.User],
});

client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user?.tag}`);

  // Load persisted ticket data from disk
  await initializeStore();

  const guild = await client.guilds.fetch(config.guildId);
  const panelChannel = guild.channels.cache.get(config.ticketPanelChannelId);

  if (panelChannel && panelChannel.isTextBased()) {
    await panelChannel.send({
      components: createTicketPanelComponents(),
      flags: MessageFlags.IsComponentsV2,
    });
  }

  const verificationChannel = guild.channels.cache.get(config.verificationPanelChannelId);
  if (verificationChannel && verificationChannel.isTextBased()) {
    await verificationChannel.send({
      components: createVerificationPanelComponents(),
      flags: MessageFlags.IsComponentsV2,
    });
  }
});

// Welcome new members
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild = member.guild;
    const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);

    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      console.error('Welcome channel not found or is not text-based');
      return;
    }

    const welcomeMessage = `<:emoji_17:1537726567713742869> Welcome <@${member.id}> to Miami City Roleplay, we are so delighted to have you here!\n-# For assistance, please click this: https://discord.com/channels/1358021819688423584/1537251875362181210`;

    await welcomeChannel.send({
      content: welcomeMessage,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('welcome_member_count')
            .setEmoji({ id: '1537726567713742869' })
            .setLabel(`${guild.memberCount.toLocaleString()} Members`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        ),
      ],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ticket') {
      const ticketType = interaction.options.getString('type') ?? 'general';
      const customName = interaction.options.getString('name') ?? '';
      const modal = new ModalBuilder()
        .setCustomId(`ticket_issue:${ticketType}:${encodeURIComponent(customName)}`)
        .setTitle('Describe Your Issue')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('issue')
              .setLabel('How can we help?')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Please provide as much detail as possible.')
              .setRequired(true)
              .setMaxLength(1000)
          )
        );
      await interaction.showModal(modal);
    }

    if (interaction.commandName === 'claim') {
      await handleClaimCommand(interaction);
    }

    if (interaction.commandName === 'unclaim') {
      await handleUnclaimCommand(interaction);
    }

    if (interaction.commandName === 'forceunclaim') {
      await handleForceUnclaimCommand(interaction);
    }

    if (interaction.commandName === 'lookup') {
      await handleLookupCommand(interaction);
    }

    if (interaction.commandName === 'transfer') {
      await handleTransferCommand(interaction);
    }

    if (interaction.commandName === 'ticket-rename') {
      await handleTicketRenameCommand(interaction);
    }

    if (interaction.commandName === 'close-request') {
      await handleCloseRequestCommand(interaction);
    }

    if (interaction.commandName === 'ticket-stats') {
      await handleTicketStatusCommand(interaction);
    }

    if (interaction.commandName === 'ticket-remove') {
      await handleTicketRemoveCommand(interaction);
    }

    if (interaction.commandName === 'ticket-unclaim') {
      await handleTicketUnclaimCommand(interaction);
    }

    if (interaction.commandName === 'ticket-add') {
      await handleTicketAddCommand(interaction);
    }

    if (interaction.commandName === 'close') {
      await handleTicketCloseCommand(interaction);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_type_select') {
    const ticketType = interaction.values[0];
    const metadata = getTicketMetadata(interaction.channel?.id ?? '');

    if (metadata) {
      await interaction.reply({ content: 'This channel is already tied to a ticket.', flags: MessageFlags.Ephemeral });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`ticket_issue:${ticketType}:`)
      .setTitle('Describe Your Issue')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('issue')
            .setLabel('How can we help?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Please provide as much detail as possible.')
            .setRequired(true)
            .setMaxLength(1000)
        )
      );
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_issue:')) {
    const [, ticketType, encodedCustomName = ''] = interaction.customId.split(':');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await openTicket({
      interaction,
      guild: interaction.guild,
      ticketType,
      customName: decodeURIComponent(encodedCustomName) || null,
      issue: interaction.fields.getTextInputValue('issue').trim(),
    });
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'verify_bloxlink') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const bloxlinkInfo = await getBloxlinkRobloxInfo(interaction.guildId, interaction.user.id);
      if (!bloxlinkInfo.isVerified || !bloxlinkInfo.robloxUsername) {
        await interaction.editReply(
          `We could not find a verified Roblox account through Bloxlink. Please verify or update your account here: ${config.bloxlinkVerificationUrl}\nThen click **Verify** again.`
        );
        return;
      }

      const member = interaction.member;
      if (!member || typeof member.setNickname !== 'function') {
        await interaction.editReply('I could not update your nickname in this server.');
        return;
      }

      try {
        await member.setNickname(bloxlinkInfo.robloxUsername, 'Bloxlink verification');
        await interaction.editReply(`Verification successful. Your nickname is now **${bloxlinkInfo.robloxUsername}**.`);
      } catch (error) {
        console.error('Error updating verified nickname:', error);
        await interaction.editReply('Your Roblox account was verified, but I could not update your nickname. Please check my permissions.');
      }
      return;
    }

    if (interaction.customId.startsWith('ticket_rating:')) {
      const [, ticketId, ratingValue] = interaction.customId.split(':');
      const rating = Number(ratingValue);
      const metadata = getTicketById(ticketId);

      if (!metadata || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        await interaction.reply({ content: 'This ticket rating is no longer available.', flags: MessageFlags.Ephemeral });
        return;
      }

      if (metadata.ownerId !== interaction.user.id) {
        await interaction.reply({ content: 'Only the ticket opener can submit this rating.', flags: MessageFlags.Ephemeral });
        return;
      }

      if (metadata.rating) {
        await interaction.reply({ content: 'A rating has already been submitted for this ticket.', flags: MessageFlags.Ephemeral });
        return;
      }

      metadata.rating = rating;
      syncTicketMetadata(metadata.channelId, metadata);

      await interaction.update({
        components: [createTicketRatingActionRow({ ticketId, disabled: true, selectedRating: rating })],
      });

      try {
        const guild = await client.guilds.fetch(config.guildId);
        const logChannel = guild.channels.cache.get(config.logChannelId);
        if (logChannel?.isTextBased()) {
          await logChannel.send({
            components: embedToV2Components(createTicketRatingLogEmbed({
              ownerId: metadata.ownerId,
              claimedBy: metadata.claimedBy,
              closedBy: metadata.closedBy,
              ticketId: metadata.ticketId,
              rating,
            })),
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
          });
        }
      } catch (error) {
        console.error(`Unable to log rating for ticket ${metadata.ticketId}:`, error);
      }
      return;
    }

    if (interaction.customId === 'cancel_close_ticket') {
      const metadata = getTicketMetadata(interaction.channel?.id ?? '');
      if (!metadata || !interaction.member.roles.cache.has(config.supportRoleId)) {
        await interaction.reply({ content: 'You need the support role to manage ticket closure.', flags: MessageFlags.Ephemeral });
        return;
      }

      const confirmation = createCloseConfirmationEmbed({ cancelled: true });
      confirmation.components[0].components[0].setDisabled(true);
      confirmation.components[0].components[1].setDisabled(true).setLabel('Cancelled');
      await interaction.update(confirmation);
      return;
    }

    // Defer reply immediately to avoid 3-second timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const metadata = getTicketMetadata(interaction.channel?.id ?? '');

    if (!metadata) {
      await interaction.editReply({ content: 'This is not a tracked ticket channel.' });
      return;
    }

    if (!interaction.member.roles.cache.has(config.supportRoleId)) {
      await interaction.editReply({ content: 'You need the support role to manage claims.' });
      return;
    }

    if (interaction.customId === 'close_ticket') {
      const confirmation = createCloseConfirmationEmbed();
      await interaction.editReply(confirmation);
      return;
    }

    if (interaction.customId === 'confirm_close_ticket') {

      try {
        const ticketChannel = interaction.channel;
        const guild = interaction.guild;
        const logChannel = guild.channels.cache.get(config.logChannelId);
        const transcriptChannel = guild.channels.cache.get(config.transcriptChannelId);

        if (!logChannel || !logChannel.isTextBased() || !transcriptChannel || !transcriptChannel.isTextBased()) {
          await interaction.editReply({ content: 'The ticket log or transcript channel is not configured correctly.' });
          return;
        }

        metadata.closedAt = new Date().toISOString();
        metadata.closedBy = interaction.user.id;
        syncTicketMetadata(interaction.channel.id, metadata);

        const transcriptPath = await saveTranscript(ticketChannel);

        const logEmbed = addBrandImage(new EmbedBuilder()
          .setColor(0xFFFFFF)
          .setTitle('🔒 Ticket Closed')
          .setDescription(`Ticket ${metadata.ticketId} has been closed.`)
          .addFields(
            { name: '**Ticket ID**', value: `> ${metadata.ticketId}`, inline: true },
            { name: '**User**', value: `> <@${metadata.ownerId}>`, inline: true },
            { name: '**Claimed By**', value: `> ${metadata.claimedBy ? `<@${metadata.claimedBy}>` : 'Unclaimed'}`, inline: true },
            { name: '**Closed By**', value: `> <@${interaction.user.id}>`, inline: true },
            { name: '**Closed At**', value: `> ${new Date().toLocaleString()}`, inline: true },
            ...(metadata.closeReason ? [{ name: '**Close Reason**', value: `> ${metadata.closeReason}` }] : [])
          )
          .setFooter({ text: `Miami City Roleplay ${new Date().toLocaleDateString('en-US')}` })
          .setTimestamp());

        await transcriptChannel.send({ files: [transcriptPath] });
        await logChannel.send({
          components: embedToV2Components(logEmbed),
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [] },
        });

        try {
          const owner = await guild.members.fetch(metadata.ownerId);
          await owner.send({
            embeds: [logEmbed],
            files: [transcriptPath],
            components: [createTicketRatingActionRow({ ticketId: metadata.ticketId })],
          });
        } catch (error) {
          console.error(`Unable to send close DM for ticket ${metadata.ticketId}:`, error);
        }

        await interaction.editReply({ content: `Ticket ${metadata.ticketId} has been closed and archived.` });

        setTimeout(() => ticketChannel.delete().catch(console.error), 1000);
      } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply({ content: 'An error occurred while closing the ticket.' });
      }
      return;
    }

    if (interaction.customId === 'confirm_close_ticket_request') {

      try {
        const ticketChannel = interaction.channel;
        const guild = interaction.guild;
        const logChannel = guild.channels.cache.get(config.logChannelId);
        const transcriptChannel = guild.channels.cache.get(config.transcriptChannelId);

        if (!logChannel || !logChannel.isTextBased() || !transcriptChannel || !transcriptChannel.isTextBased()) {
          await interaction.editReply({ content: 'The ticket log or transcript channel is not configured correctly.' });
          return;
        }

        metadata.closedAt = new Date().toISOString();
        metadata.closedBy = interaction.user.id;
        syncTicketMetadata(interaction.channel.id, metadata);

        const transcriptPath = await saveTranscript(ticketChannel);

        const logEmbed = addBrandImage(new EmbedBuilder()
          .setColor(0xFFFFFF)
          .setTitle('🔒 Ticket Closed')
          .setDescription(`Ticket ${metadata.ticketId} has been closed.`)
          .addFields(
            { name: '**Ticket ID**', value: `> ${metadata.ticketId}`, inline: true },
            { name: '**User**', value: `> <@${metadata.ownerId}>`, inline: true },
            { name: '**Claimed By**', value: `> ${metadata.claimedBy ? `<@${metadata.claimedBy}>` : 'Unclaimed'}`, inline: true },
            { name: '**Closed By**', value: `> <@${interaction.user.id}>`, inline: true },
            { name: '**Closed At**', value: `> ${new Date().toLocaleString()}`, inline: true },
            ...(metadata.closeReason ? [{ name: '**Close Reason**', value: `> ${metadata.closeReason}` }] : [])
          )
          .setFooter({ text: `Miami City Roleplay ${new Date().toLocaleDateString('en-US')}` })
          .setTimestamp());

        await transcriptChannel.send({ files: [transcriptPath] });
        await logChannel.send({
          components: embedToV2Components(logEmbed),
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [] },
        });

        try {
          const owner = await guild.members.fetch(metadata.ownerId);
          await owner.send({
            embeds: [logEmbed],
            files: [transcriptPath],
            components: [createTicketRatingActionRow({ ticketId: metadata.ticketId })],
          });
        } catch (error) {
          console.error(`Unable to send close DM for ticket ${metadata.ticketId}:`, error);
        }

        await interaction.editReply({ content: `Ticket ${metadata.ticketId} has been closed and archived.` });

        setTimeout(() => ticketChannel.delete().catch(console.error), 1000);
      } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply({ content: 'An error occurred while closing the ticket.' });
      }
      return;
    }

    if (interaction.customId === 'cancel_close_ticket_request') {
      const closeRequestRow = ActionRowBuilder.from(interaction.message.components.at(-1));
      closeRequestRow.components[0].setDisabled(true);
      closeRequestRow.components[1].setDisabled(true).setLabel('Cancelled');
      await interaction.message.edit({
        components: [...interaction.message.components.slice(0, -1), closeRequestRow],
      });
      await interaction.channel.send({
        embeds: [createCloseCancellationEmbed({ userId: interaction.user.id })],
        allowedMentions: { parse: [] },
      });
      await interaction.editReply({ content: 'Ticket closure has been cancelled.' });
      return;
    }

    if (interaction.customId === 'toggle_claim_ticket') {
      if (!metadata.claimedBy) {
        metadata.claimedBy = interaction.user.id;
        if (!metadata.originalChannelName) {
          metadata.originalChannelName = interaction.channel.name;
        }
        syncTicketMetadata(interaction.channel.id, metadata);

        await interaction.editReply({ content: `Ticket ${metadata.ticketId} is now claimed by <@${interaction.user.id}>.` });

        // Send claim notification embed
        const claimEmbed = createClaimNotificationEmbed({
          userId: interaction.user.id,
          username: interaction.user.username,
        });
        await interaction.channel.send({ embeds: [claimEmbed], allowedMentions: { parse: [] } });

        syncTicketMetadata(interaction.channel.id, metadata);

        const payload = updateTicketTopEmbedWithButtons(interaction.message, interaction.user.id, interaction.user.id);
        if (payload) {
          await interaction.message.edit(payload);
        }
        return;
      }

      if (metadata.claimedBy === interaction.user.id) {
        metadata.claimedBy = null;
        syncTicketMetadata(interaction.channel.id, metadata);

        await interaction.editReply({ content: `Ticket ${metadata.ticketId} has been unclaimed.` });

        // Send unclaim notification embed
        const unclaimEmbed = createUnclaimNotificationEmbed({
          userId: interaction.user.id,
          username: interaction.user.username,
        });
        await interaction.channel.send({ embeds: [unclaimEmbed], allowedMentions: { parse: [] } });

        const payload = updateTicketTopEmbedWithButtons(interaction.message, null, interaction.user.id);
        if (payload) {
          await interaction.message.edit(payload);
        }
        return;
      }

      await interaction.editReply({ content: `<@${metadata.claimedBy}> has already **claimed** this ticket!` });
    }
  }
});

await client.login(config.botToken);
