<template>
  <div class="gallery gallery--videos" :class="{ 'gallery--videos--grid': videos.length > 1 }">
    <div v-for="(video, index) in videos" :key="video.id" class="gallery--videos__item">
      <div
        class="gallery--videos__player"
        :data-plyr-provider="'youtube'"
        :data-plyr-embed-id="getYouTubeId(video.link)"
      >
        <img
          :src="getYouTubeThumbnail(video.link)"
          :alt="`Video ${index + 1}`"
          class="gallery--videos__thumbnail"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

interface Video {
  id: number
  link: string
}

interface Props {
  videos: Video[]
}

defineProps<Props>()

const getYouTubeId = (url: string) => {
  return url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || ''
}

const getYouTubeThumbnail = (
  url: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'
) => {
  const videoId = getYouTubeId(url)
  if (!videoId) return null

  const thumbnailUrls = {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  }

  return thumbnailUrls[quality]
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    import('plyr').then(Plyr => {
      // Inicializar todos los players de YouTube
      const players = document.querySelectorAll('.gallery--videos__player')
      players.forEach(player => {
        new Plyr.default(player, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'settings',
            'fullscreen',
          ],
          settings: ['quality', 'speed'],
          quality: {
            default: 720,
            options: [1080, 720, 480, 360],
          },
          clickToPlay: true,
          keyboard: { focused: true, global: false },
        })
      })
    })
  }
})
</script>
