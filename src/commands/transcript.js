import { createTicketStatusEmbed } from '../utilities/embeds.js';
import { getTicketMetadata, saveTranscript } from '../utilities/ticketStore.js';

export async function handleTranscriptCommand(interaction) {
  // Defer reply immediately to avoid 3-second timeout
  await interaction.deferReply({ ephemeral: true });

  const ticketChannel = interaction.channel;
  if (!ticketChannel || !ticketChannel.isTextBased()) {
    await interaction.editReply({ content: 'This command can only be used inside a ticket channel.' });
    return;
  }

  const metadata = getTicketMetadata(ticketChannel.id);
  if (!metadata) {
    await interaction.editReply({ content: 'This channel does not appear to be a tracked ticket.' });
    return;
  }

  const transcriptPath = await saveTranscript(ticketChannel);
  const embed = createTicketStatusEmbed({
    title: '📄 Transcript Saved',
    description: `Transcript saved successfully for ${metadata.ticketId}.`,
    ticketId: metadata.ticketId,
    channelId: ticketChannel.id,
    claimedBy: metadata.claimedBy ? `<@${metadata.claimedBy}>` : 'Unclaimed',
  });

  await interaction.editReply({ files: [transcriptPath] });
  await interaction.followUp({ embeds: [embed], ephemeral: true });
}
