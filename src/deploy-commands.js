import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from './utilities/config.js';

const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Support type')
        .addChoices(
          { name: 'General Support', value: 'general' },
          { name: 'Internal Affairs Support', value: 'internal_affairs' },
          { name: 'Management Support', value: 'management' },
          { name: 'Partnership Support', value: 'partnership' }
        )
    )
    .addStringOption((option) => option.setName('name').setDescription('Optional custom ticket name')),
  new SlashCommandBuilder().setName('claim').setDescription('Claim the current ticket'),
  new SlashCommandBuilder().setName('unclaim').setDescription('Unclaim the current ticket'),
  new SlashCommandBuilder().setName('forceunclaim').setDescription('Force-unclaim the current ticket'),
  new SlashCommandBuilder().setName('ticket-rename').setDescription('Rename ticket with claimed format'),
  new SlashCommandBuilder()
    .setName('close-request')
    .setDescription('Request to close the current ticket')
    .addStringOption((option) => option.setName('reason').setDescription('Optional reason for closing').setMaxLength(1000)),
  new SlashCommandBuilder()
    .setName('ticket-stats')
    .setDescription('View ticket performance stats')
    .addUserOption((option) => option.setName('user').setDescription('User to check (optional)')),
  new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Remove a user from the ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to remove').setRequired(true)),
  new SlashCommandBuilder().setName('ticket-unclaim').setDescription('Unclaim the ticket via command'),
  new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Add a user to the ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to add').setRequired(true)),
  new SlashCommandBuilder().setName('close').setDescription('Close ticket with log and transcript'),
  new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Look up a ticket by ID')
    .addStringOption((option) => option.setName('ticketid').setDescription('Ticket ID').setRequired(true)),
  new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer ticket to a different category')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Ticket category to transfer to')
        .setRequired(true)
        .addChoices(
          { name: 'General Support', value: 'general' },
          { name: 'Internal Affairs Support', value: 'internal_affairs' },
          { name: 'Management Support', value: 'management' },
          { name: 'Partnership Support', value: 'partnership' }
        )
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.botToken);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: commands,
  });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}
