import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const ticketStore = new Map();
const ticketIdStore = new Map();
const STORE_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.resolve(STORE_DIR, 'tickets.json');

function generateTicketId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function ensureStoreDir() {
  try {
    await mkdir(STORE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating store directory:', error);
  }
}

async function loadFromDisk() {
  try {
    if (!existsSync(STORE_FILE)) {
      return;
    }

    const data = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(data);

    // Rebuild the maps from persisted data
    for (const [channelId, metadata] of Object.entries(parsed)) {
      ticketStore.set(channelId, metadata);
      if (metadata.ticketId) {
        ticketIdStore.set(metadata.ticketId, metadata);
      }
    }

    console.log(`Loaded ${ticketStore.size} tickets from disk`);
  } catch (error) {
    console.error('Error loading tickets from disk:', error);
  }
}

async function saveToDisk() {
  try {
    await ensureStoreDir();
    const data = Object.fromEntries(ticketStore);
    await writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving tickets to disk:', error);
  }
}

export function getTicketMetadata(channelId) {
  return ticketStore.get(channelId) ?? null;
}

export function getTicketById(ticketId) {
  return ticketIdStore.get(ticketId) ?? null;
}

export function getOpenTicketsForOwner(ownerId) {
  return [...ticketStore.values()].filter((metadata) => metadata.ownerId === ownerId && !metadata.closedAt);
}

export function getTicketsForOwner(ownerId) {
  return [...ticketStore.values()].filter((metadata) => metadata.ownerId === ownerId);
}

export function getAllTickets() {
  return [...ticketStore.values()];
}

export function syncTicketMetadata(channelId, metadata) {
  ticketStore.set(channelId, metadata);

  if (metadata.ticketId) {
    ticketIdStore.set(metadata.ticketId, metadata);
  }

  // Save to disk asynchronously
  saveToDisk().catch(console.error);
}

export function removeTicketMetadata(channelId) {
  const metadata = ticketStore.get(channelId);
  if (metadata && metadata.ticketId) {
    ticketIdStore.delete(metadata.ticketId);
  }
  ticketStore.delete(channelId);
  saveToDisk().catch(console.error);
}

export function createTicketMetadata({ ticketType, ownerId, channelId }) {
  const ticketId = generateTicketId();
  const metadata = {
    ticketId,
    ticketType,
    ownerId,
    channelId,
    claimedBy: null,
    originalChannelName: null,
    escalated: false,
    createdAt: new Date().toISOString(),
    closedAt: null,
    closedBy: null,
    closeReason: null,
    rating: null,
  };

  syncTicketMetadata(channelId, metadata);
  return metadata;
}

export function buildClaimedChannelName(username) {
  const safeUsername = String(username ?? 'user')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `🟢-claimed-${safeUsername}`.slice(0, 100);
}

export function buildUnclaimedChannelName(metadata, fallbackName) {
  return metadata?.originalChannelName ?? fallbackName;
}

export function buildTicketChannelNameForState(metadata, username) {
  if (metadata?.claimedBy) {
    return buildClaimedChannelName(username);
  }

  return buildUnclaimedChannelName(metadata, metadata?.channelName ?? metadata?.originalChannelName ?? null);
}

export function resolveOriginalTicketName(metadata, fallbackName) {
  return metadata?.originalChannelName ?? fallbackName;
}

export async function renameTicketChannel(channel, newName, reason = 'Ticket status updated') {
  const updatedChannel = await channel.edit({ name: newName }, reason);
  return updatedChannel?.name ?? newName;
}

export async function saveTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const transcript = messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .filter((message) => Boolean(message.content?.trim()))
    .map((message) => {
      const author = message.member?.displayName ?? message.author.username;
      return `${author}: ${message.content.trim()}`;
    })
    .join('\n');

  const transcriptDir = path.resolve(process.cwd(), 'transcripts');
  await mkdir(transcriptDir, { recursive: true });

  const transcriptFile = path.resolve(transcriptDir, `${channel.name}-${Date.now()}.txt`);
  await writeFile(transcriptFile, transcript || 'No transcript available.', 'utf8');

  return transcriptFile;
}

// Load persisted data on startup
export async function initializeStore() {
  await loadFromDisk();
}
