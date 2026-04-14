const DEFAULT_SITE_NAME = 'AI Gallery';

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME;

const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL;

if (!mainSiteUrl) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_MAIN_SITE_URL is required but was not provided.'
  );
}

export const siteUrl = mainSiteUrl;
export const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '';
export const siteEmoji = process.env.NEXT_PUBLIC_SITE_EMOJI || '🤖';
export const siteAuthor = process.env.NEXT_PUBLIC_SITE_AUTHOR || '';
// Prefix for localStorage keys — change this if running multiple instances in the same browser
export const storagePrefix = process.env.NEXT_PUBLIC_STORAGE_PREFIX || 'app';
export const socialXUrl = process.env.NEXT_PUBLIC_SOCIAL_X_URL || '';
export const socialFacebookUrl = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL || '';
export const socialInstagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || '';
export const socialDiscordUrl = process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL || '';
export const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || '';
