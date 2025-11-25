<template>
  <div class="about-us-page">
    <!-- Banner -->
    <section class="banner" :style="{ backgroundImage: `url(${bannerImage})` }">
      <div class="overlay">
        <div class="banner-content">
          <h1>{{ t('aboutUs.banner.title') }}</h1>
          <p>{{ t('aboutUs.banner.subtitle') }}</p>
        </div>
      </div>
    </section>

    <!-- Our Story -->
    <section class="our-story fade-in" :class="{ visible: isVisible.story }">
      <h2>{{ t('aboutUs.ourStory.title') }}</h2>
      <p>{{ t('aboutUs.ourStory.text') }}</p>
    </section>

    <!-- About the team -->
    <main>
      <h1 class="space">{{ t('aboutUs.team.title') }}</h1>
      <section class="team-grid">
        <div
          v-for="(member, index) in teamMembers"
          :key="index"
          class="team-member fade-in"
          :class="{ visible: isVisible[`member${index}`] }"
        >
          <img class="profile-pic" :src="getImagePath(member.image)" :alt="member.name" />
          <h2>{{ member.name }}</h2>
          <p class="role">{{ member.customRole ? t(member.customRole) : t('aboutUs.team.role') }}</p>
          <div class="links">
            <a :href="member.linkedin" target="_blank">
              <img :src="getImagePath('LinkedIn_icon.svg')" alt="LinkedIn" class="icon" />
              LinkedIn
            </a>
            <a :href="member.github" target="_blank">
              <img :src="getImagePath('GitHub_Icon.svg')" alt="GitHub" class="icon" />
              GitHub
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer>
      <div class="footer-container">
        <div class="footer-left">
          <h3>{{ t('aboutUs.footer.aboutTitle') }}</h3>
          <p>
            <span>{{ t('aboutUs.footer.githubText') }}</span>
            <a href="https://github.com/IronHack-2025" target="_blank"><strong>GitHub</strong></a>
          </p>
          <p>
            <span>{{ t('aboutUs.footer.educationalText') }}</span>
            <a href="https://www.ironhack.com/es" target="_blank"><strong>IronHack</strong></a>
          </p>
        </div>

        <div class="footer-middle">
          <h3>{{ t('aboutUs.footer.joinTitle') }}</h3>
          <p>{{ t('aboutUs.footer.joinText') }}</p>
          <a href="mailto:team@ironhealth.com" class="footer-btn">{{
            t('aboutUs.footer.contactBtn')
          }}</a>
        </div>

        <div class="footer-right">
          <h3>{{ t('aboutUs.footer.whereTitle') }}</h3>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d67723.10945872823!2d2.1570907899972327!3d41.39652581348283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2ses!4v1759511666063!5m2!1ses!2ses"
            width="300"
            height="180"
            style="border: 0"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          >
          </iframe>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const bannerImage = `${import.meta.env.BASE_URL}about-us/images/BannerBackground.jpg`

const teamMembers = [
  {
    name: 'Christian Baron',
    image: 'ChristianBaron.jpg',
    linkedin: 'https://www.linkedin.com/in/christianbaron-/',
    github: 'https://github.com/ccbaron',
  },
  {
    name: 'Maria Jie Bolós',
    image: 'MariaJieB.jpg',
    linkedin: 'https://www.linkedin.com/in/maria-jie-bolós-gago-7a9240211',
    github: 'https://github.com/shimotachi3',
  },
  {
    name: 'Sergio Calvo',
    image: 'SergioCalvo.jpg',
    linkedin: 'https://www.linkedin.com/in/sergiocalvomiron/',
    github: 'https://github.com/SergioCaMi',
  },
  {
    name: 'Robert Maynou',
    image: 'RobertMaynou.jpg',
    linkedin: 'https://www.linkedin.com/in/robert-maynou-96585527a/',
    github: 'https://github.com/ErebosXYZ',
  },
  {
    name: 'Óscar Miras',
    image: 'OscarMiras.jpg',
    linkedin: 'https://www.linkedin.com/in/mirasortiz/',
    github: 'https://github.com/omiras',
    customRole: 'aboutUs.team.mentorRole',
  },
  {
    name: 'Alejandro Noriega',
    image: 'AlejandroNR.jpg',
    linkedin: 'https://www.linkedin.com/in/alejandro-noriega-guerra-b89435a3/',
    github: 'https://github.com/alenorgue',
  },
  {
    name: 'Juan David Ospina',
    image: 'JuanDavid.jpg',
    linkedin: 'https://www.linkedin.com/in/jd-ol/',
    github: 'https://github.com/juandation',
  },
]

const isVisible = ref({
  story: false,
})

// Inicializar visibilidad para cada miembro del equipo
teamMembers.forEach((_, index) => {
  isVisible.value[`member${index}`] = false
})

const getImagePath = (imageName) => {
  return `${import.meta.env.BASE_URL}about-us/images/${imageName}`
}

let observer = null

onMounted(() => {
  const elements = document.querySelectorAll('.fade-in')

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('our-story')) {
            isVisible.value.story = true
          } else if (entry.target.classList.contains('team-member')) {
            const index = Array.from(entry.target.parentElement.children).indexOf(entry.target)
            isVisible.value[`member${index}`] = true
          }
        }
      })
    },
    { threshold: 0.2 }
  )

  elements.forEach((el) => observer.observe(el))
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
:root {
  --ironhealth-blue: rgb(24, 103, 192);
}

.about-us-page {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #fff;
  color: #333;
  overflow-x: hidden;
}

.space {
  margin-top: 7rem;
}

/* Banner */
.banner {
  width: 100%;
  height: 40vh;
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  background-size: cover;
  background-position: center -40px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(24, 103, 192, 0.8);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 10%;
  box-sizing: border-box;
}

.banner-content {
  position: relative;
  color: white;
  max-width: 90%;
  transform: translateY(120px);
}

.banner-content h1 {
  font-size: 6rem;
  margin: 0;
}

.banner-content p {
  font-size: 1.8rem;
  margin-top: -2rem;
}

/* Our Story */
.our-story {
  padding: 4rem 2rem 8rem;
  text-align: center;
}

.our-story h2 {
  font-size: 3rem;
  margin-bottom: 2rem;
}

.our-story p {
  max-width: 60%;
  margin: 0 auto;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* About the team */
.team-grid {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 6rem;
}

.team-member {
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 2rem;
  width: 280px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: 0;
  transform: translateY(20px);
}

.team-member:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.profile-pic {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.team-member h2 {
  margin: 0.5rem 0;
  font-size: 1.4rem;
}

.role {
  color: gray;
  font-size: 1rem;
}

.links {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.links a {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ironhealth-blue);
  text-decoration: none;
  font-weight: bold;
}

.links a:hover {
  text-decoration: underline;
}

.icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  vertical-align: middle;
}

main h1 {
  text-align: center;
  font-size: 3rem;
}

/* Footer */
footer {
  background-color: #f0f0f0;
  padding: 2rem;
}

.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
}

footer h3 {
  color: var(--ironhealth-blue);
  margin-bottom: 0.8rem;
  text-decoration:underline;
  font-weight: bold;
}

footer p {
  margin: 0.5rem 0;
  color: #333;
}

footer a {
  color: var(--ironhealth-blue);
  font-weight: bold;
  text-decoration: none;
  transition: color 0.3s ease;
}

footer a:hover {
  text-decoration: underline;
  color: rgb(20, 85, 160);
}

.footer-left,
.footer-middle,
.footer-right {
  flex: 1;
  min-width: 250px;
}

.footer-btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background-color: var(--ironhealth-blue);
  color: black;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.footer-btn:hover {
  background-color: rgb(20, 85, 160);
}

.footer-right iframe {
  border-radius: 8px;
  width: 100%;
  max-width: 350px;
}

/* Animations */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 992px) {
  .banner-content h1 {
    font-size: 4rem;
  }
  .banner-content p {
    font-size: 1.4rem;
  }
  .mission-values {
    padding: 4rem 6rem;
    text-align: center;
  }
  .mission-values p {
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .banner-content h1 {
    font-size: 3rem;
  }
  .banner-content p {
    font-size: 1.2rem;
  }
  .mission-values {
    padding: 3rem 2rem;
  }
  .our-story {
    padding: 4rem 1.5rem;
  }
  .our-story h2 {
    font-size: 2.2rem;
  }
}

@media (max-width: 576px) {
  .banner {
    height: 40vh;
  }
  .banner-content h1 {
    font-size: 2.2rem;
  }
  .banner-content p {
    font-size: 1rem;
  }
  .our-story p,
  .mission-values p {
    font-size: 1rem;
  }
  main h1 {
    font-size: 2.2rem;
  }
  .team-member {
    width: 100%;
    max-width: 320px;
  }
}
</style>
