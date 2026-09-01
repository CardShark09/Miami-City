import { MessageFlags, EmbedBuilder } from 'discord.js';
import { config } from '../utilities/config.js';
import { getTicketMetadata, syncTicketMetadata, saveTranscript } from '../utilities/ticketStore.js';
import { addBrandImage, createTicketRatingActionRow, embedToV2Components } from '../utilities/embeds.js';

export async function handleTicketCloseCommand(interaction) {
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
    await interaction.reply({ content: 'You need the support role to close tickets.', flags: MessageFlags.Ephemeral });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.reply({ content: 'This channel does not appear to be a tracked ticket.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const logChannel = guild.channels.cache.get(config.logChannelId);
    const transcriptChannel = guild.channels.cache.get(config.transcriptChannelId);

    if (!logChannel || !logChannel.isTextBased() || !transcriptChannel || !transcriptChannel.isTextBased()) {
      await interaction.editReply({ content: 'The ticket log or transcript channel is not configured correctly.' });
      return;
    }

    // Update metadata with close info
    metadata.closedAt = new Date().toISOString();
    metadata.closedBy = interaction.user.id;
    syncTicketMetadata(ticketChannel.id, metadata);

    // Generate transcript
    const transcriptPath = await saveTranscript(ticketChannel);

    // Create log embed
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
        { name: '**Type**', value: `> ${metadata.ticketType}`, inline: true },
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
}
