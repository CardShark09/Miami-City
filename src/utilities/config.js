import dotenv from 'dotenv';

dotenv.config();

const requiredEnvKeys = [
  'BOT_TOKEN',
  'CLIENT_ID',
  'GUILD_ID',
  'TICKET_CATEGORY_ID',
  'SUPPORT_ROLE_ID',
  'LOG_CHANNEL_ID',
  'TRANSCRIPT_CHANNEL_ID',
  'HIGH_RANK_ROLE_ID',
  'TICKET_PANEL_CHANNEL_ID',
];

const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingKeys.join(', ')}. Copy .env.example to .env and fill them in.`
  );
}

export const config = {
  botToken: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  supportRoleId: process.env.SUPPORT_ROLE_ID,
  openerPingRoleId: process.env.OPENER_PING_ROLE_ID ?? '1537251419046805584',
  logChannelId: process.env.LOG_CHANNEL_ID,
  transcriptChannelId: process.env.TRANSCRIPT_CHANNEL_ID,
  highRankRoleId: process.env.HIGH_RANK_ROLE_ID,
  ticketPanelChannelId: process.env.TICKET_PANEL_CHANNEL_ID,
  verificationPanelChannelId: process.env.VERIFICATION_PANEL_CHANNEL_ID ?? '1538832529157656667',
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID ?? '1537252048117039216',
  internalAffairsSupportCategoryId:
    process.env.INTERNAL_AFFAIRS_SUPPORT_CATEGORY_ID ?? process.env.SUPERVISORY_SUPPORT_CATEGORY_ID,
  managementSupportCategoryId: process.env.MANAGEMENT_SUPPORT_CATEGORY_ID,
  partnershipSupportCategoryId: process.env.PARTNERSHIP_SUPPORT_CATEGORY_ID,
  bloxlinkApiKey: process.env.BLOXLINK_API_KEY ?? '',
  bloxlinkVerificationUrl: process.env.BLOXLINK_VERIFICATION_URL ?? 'https://blox.link/verify',
  brandImageUrl: process.env.BRAND_IMAGE_URL ?? null,
};
