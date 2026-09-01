import { EmbedBuilder, MessageFlags } from 'discord.js';
import { addBrandImage, embedToV2Components } from '../utilities/embeds.js';
import { getAllTickets } from '../utilities/ticketStore.js';

export async function handleTicketStatusCommand(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options?.getUser('user');
  const userId = targetUser?.id ?? interaction.user.id;
  const user = targetUser ?? interaction.user;

  const allTickets = getAllTickets();
  const claimedTickets = allTickets.filter((ticket) => ticket.claimedBy === userId);
  const closedTickets = allTickets.filter((ticket) => ticket.closedBy === userId).length;
  const ratings = claimedTickets
    .map((ticket) => ticket.rating)
    .filter((rating) => Number.isFinite(rating));
  const averageRating = ratings.length
    ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)
    : 'N/A';

  const embed = addBrandImage(new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setTitle(`Ticket Stats for ${user.username}`)
    .addFields(
      { name: '**Claimed Tickets**', value: `> ${claimedTickets.length}`, inline: true },
      { name: '**Average Rating**', value: `> ${averageRating}`, inline: true },
      { name: '**Closed Tickets**', value: `> ${closedTickets}`, inline: true }
    )
    .setFooter({ text: `User ID: ${userId}` })
    .setTimestamp());

  const channel = interaction.channel;
  if (!channel?.isTextBased()) {
    await interaction.editReply({ content: 'This command can only be used in a text channel.' });
    return;
  }

  await channel.send({
    components: embedToV2Components(embed),
    flags: MessageFlags.IsComponentsV2,
  });
  await interaction.deleteReply();
}
