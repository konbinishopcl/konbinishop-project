<template>
  <div class="card card--links">
    <div class="card--links__header">
      <Link class="card--links__icon" />
      <span class="card--links__title">Enlaces</span>
    </div>
    <div class="card--links__content">
      <div class="card--links__grid">
        <a
          v-for="socialLink in socialLinks"
          :key="socialLink.id"
          :href="socialLink.link"
          target="_blank"
          rel="noopener noreferrer"
          class="card--links__item"
        >
          <font-awesome-icon
            :icon="getSocialIcon(socialLink.link)"
            class="card--links__item-icon"
          />
          <span class="card--links__item-text">{{ getSocialName(socialLink.link) }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link } from 'lucide-vue-next'
import {
  faInstagram,
  faFacebook,
  faTwitter,
  faLinkedin,
  faYoutube,
  faTiktok,
  faDiscord,
  faTwitch,
  faGithub,
} from '@fortawesome/free-brands-svg-icons'

interface SocialLink {
  id: number
  link: string
}

interface Props {
  socialLinks?: SocialLink[]
}

defineProps<Props>()

const getSocialIcon = (url: string) => {
  if (url.includes('instagram.com')) return ['fab', 'instagram']
  if (url.includes('facebook.com')) return ['fab', 'facebook']
  if (url.includes('twitter.com') || url.includes('x.com')) return ['fab', 'twitter']
  if (url.includes('linkedin.com')) return ['fab', 'linkedin']
  if (url.includes('youtube.com')) return ['fab', 'youtube']
  if (url.includes('tiktok.com')) return ['fab', 'tiktok']
  if (url.includes('discord.gg') || url.includes('discord.com')) return ['fab', 'discord']
  if (url.includes('twitch.tv')) return ['fab', 'twitch']
  if (url.includes('github.com')) return ['fab', 'github']
  return ['fas', 'globe']
}

const getSocialName = (url: string) => {
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('facebook.com')) return 'Facebook'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'X'
  if (url.includes('linkedin.com')) return 'LinkedIn'
  if (url.includes('youtube.com')) return 'YouTube'
  if (url.includes('tiktok.com')) return 'TikTok'
  if (url.includes('discord.gg') || url.includes('discord.com')) return 'Discord'
  if (url.includes('twitch.tv')) return 'Twitch'
  if (url.includes('github.com')) return 'GitHub'
  return 'Sitio web'
}
</script>
