# Miami City Roleplay Ticket Bot

A simple Discord bot scaffold focused on a ticket workflow, using environment variables for all configurable values.

## Project structure

- `src/index.js` — bot entry point
- `src/commands/` — command handlers
- `src/utilities/` — shared helpers and environment config

## Features

- Ticket channel creation
- Support-role based access
- V2 embed usage with `EmbedBuilder`
- Environment-driven config via `.env`

## Setup

1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start in development mode:
   ```bash
   npm run dev
   ```
5. Register slash commands:
   ```bash
   npm run deploy:commands
   ```
6. Or run the bot directly:
   ```bash
   npm run start
   ```

## Required environment variables

- `BOT_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`
- `TICKET_CATEGORY_ID`
- `SUPPORT_ROLE_ID`
- `OPENER_PING_ROLE_ID`
- `LOG_CHANNEL_ID`
- `TRANSCRIPT_CHANNEL_ID`
- `HIGH_RANK_ROLE_ID`
- `TICKET_PANEL_CHANNEL_ID`
- `VERIFICATION_PANEL_CHANNEL_ID`
- `INTERNAL_AFFAIRS_SUPPORT_CATEGORY_ID`
- `MANAGEMENT_SUPPORT_CATEGORY_ID`
- `PARTNERSHIP_SUPPORT_CATEGORY_ID`

## Server migration

Update these values in `.env` for the new Discord server:

- `GUILD_ID` — new server ID.
- `TICKET_CATEGORY_ID` — General Support category ID.
- `INTERNAL_AFFAIRS_SUPPORT_CATEGORY_ID` — Internal Affairs Support category ID.
- `MANAGEMENT_SUPPORT_CATEGORY_ID` — Management Support category ID.
- `PARTNERSHIP_SUPPORT_CATEGORY_ID` — Partnership Support category ID.
- `TICKET_PANEL_CHANNEL_ID` — channel where the ticket panel is posted.
- `VERIFICATION_PANEL_CHANNEL_ID` — channel where the Bloxlink verification panel is posted.
- `LOG_CHANNEL_ID` — channel receiving ticket activity and close logs.
- `TRANSCRIPT_CHANNEL_ID` — channel receiving closed-ticket transcript files.
- `SUPPORT_ROLE_ID` — role allowed to claim and manage tickets.
- `OPENER_PING_ROLE_ID` — role pinged when a new ticket is opened.
- `HIGH_RANK_ROLE_ID` — role allowed to use elevated ticket actions.
- `BRAND_IMAGE_URL` (optional) — public image URL used in ticket embed footers and notifications.
- `BLOXLINK_API_KEY` (optional) — validate it can access the new guild's Bloxlink data.
- `BLOXLINK_VERIFICATION_URL` (optional) — Bloxlink page users should visit when they are not verified.

`BOT_TOKEN` and `CLIENT_ID` stay the same when you keep the existing Discord application. Re-run `npm run deploy:commands` after changing `GUILD_ID` so slash commands are registered in the new server.

In Discord, invite the bot to the new server and grant it `View Channels`, `Send Messages`, `Read Message History`, `Embed Links`, `Attach Files`, and `Manage Channels`. Enable the `Message Content` privileged intent in the Discord Developer Portal; the bot uses it to build transcripts.

## Ticket features included

- Support embed
- Discord V2 components
- Custom ticket naming
- Ticket opening embed
- Claim buttons and claim identifier
- Claim command
- Unclaim command
- Force unclaim command
- Custom ticket IDs
- Ticket transcripts
- Ticket logging
- Ticket lookup command
- Ticket escalation command

## Notes

- Keep all secrets and IDs in `.env`
- Do not commit `.env` to version control
- The bot is ready for a ticket command to be registered in Discord
