import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
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
  faWaze,
  faGoogle,
} from '@fortawesome/free-brands-svg-icons'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'

library.add(
  faInstagram,
  faFacebook,
  faTwitter,
  faLinkedin,
  faYoutube,
  faTiktok,
  faDiscord,
  faTwitch,
  faGithub,
  faWaze,
  faGoogle,
  faGlobe
)

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon)
})
