import './style.css'
import Experience from './src/Experience/Experience.js'

const experience = new Experience(document.querySelector('canvas.webgl'))

// Fullscreen button functionality
const fullscreenBtn = document.getElementById('fullscreen-btn')
const expandIcon = document.getElementById('fs-expand')
const compressIcon = document.getElementById('fs-compress')

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // Enter fullscreen
    document.documentElement.requestFullscreen().then(() => {
      expandIcon.style.display = 'none'
      compressIcon.style.display = 'block'
    }).catch(err => {
      console.error('Error attempting to enable fullscreen:', err)
    })
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(() => {
      expandIcon.style.display = 'block'
      compressIcon.style.display = 'none'
    })
  }
})

// Listen for fullscreen changes (e.g., ESC key)
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    expandIcon.style.display = 'block'
    compressIcon.style.display = 'none'
  }
})