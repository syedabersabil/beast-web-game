import React, { useEffect, useRef, useState } from 'react'

const App = () => {
  const canvasRef = useRef(null)
  const [health, setHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const gameStateRef = useRef({
    health: 100,
    score: 0,
    wave: 1,
    gameOver: false,
    player: null,
    beasts: [],
    projectiles: [],
    score: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const keys = {}

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Player object
    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 30,
      height: 30,
      speed: 5,
      health: 100,
      maxHealth: 100,
      vx: 0,
      vy: 0
    }

    gameStateRef.current.player = player

    // Beast class
    class Beast {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.width = 40 + Math.random() * 20
        this.height = 40 + Math.random() * 20
        this.speed = 2 + Math.random() * 1
        this.health = 50
        this.maxHealth = 50
        this.angle = Math.atan2(player.y - this.y, player.x - this.x)
      }

      update() {
        const dx = player.x - this.x
        const dy = player.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > 0) {
          this.x += (dx / distance) * this.speed
          this.y += (dy / distance) * this.speed
        }
      }

      draw(ctx) {
        // Beast body
        ctx.fillStyle = '#ff3333'
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)

        // Eyes
        ctx.fillStyle = '#ffff00'
        ctx.fillRect(this.x - this.width / 4 - 5, this.y - 5, 10, 10)
        ctx.fillRect(this.x + this.width / 4 - 5, this.y - 5, 10, 10)

        // Health bar
        ctx.fillStyle = '#333'
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2 - 15, this.width, 8)
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(
          this.x - this.width / 2,
          this.y - this.height / 2 - 15,
          (this.health / this.maxHealth) * this.width,
          8
        )
      }

      collidesWith(projectile) {
        return (
          this.x < projectile.x + projectile.radius &&
          this.x + this.width > projectile.x - projectile.radius &&
          this.y < projectile.y + projectile.radius &&
          this.y + this.height > projectile.y - projectile.radius
        )
      }

      collidesWithPlayer(player) {
        return (
          this.x < player.x + player.width &&
          this.x + this.width > player.x &&
          this.y < player.y + player.height &&
          this.y + this.height > player.y
        )
      }
    }

    // Projectile class
    class Projectile {
      constructor(x, y, vx, vy) {
        this.x = x
        this.y = y
        this.vx = vx
        this.vy = vy
        this.radius = 5
        this.speed = 8
      }

      update() {
        const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        this.x += (this.vx / length) * this.speed
        this.y += (this.vy / length) * this.speed
      }

      draw(ctx) {
        ctx.fillStyle = '#ffff00'
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4)
      }

      isOffScreen(width, height) {
        return this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10
      }
    }

    // Spawn beasts based on wave
    const spawnBeasts = (count) => {
      for (let i = 0; i < count; i++) {
        let x = Math.random() * canvas.width
        let y = Math.random() * canvas.height
        // Ensure spawn not too close to player
        while (Math.hypot(x - player.x, y - player.y) < 150) {
          x = Math.random() * canvas.width
          y = Math.random() * canvas.height
        }
        gameStateRef.current.beasts.push(new Beast(x, y))
      }
    }

    spawnBeasts(3)

    // Event listeners
    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false
    }

    const handleMouseClick = (e) => {
      const dx = e.clientX - player.x
      const dy = e.clientY - player.y
      const length = Math.sqrt(dx * dx + dy * dy)
      gameStateRef.current.projectiles.push(
        new Projectile(player.x, player.y, dx / length, dy / length)
      )
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('click', handleMouseClick)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    // Game loop
    let animationId
    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update player position
      player.vx = 0
      player.vy = 0
      if (keys['w'] || keys['arrowup']) player.vy = -player.speed
      if (keys['s'] || keys['arrowdown']) player.vy = player.speed
      if (keys['a'] || keys['arrowleft']) player.vx = -player.speed
      if (keys['d'] || keys['arrowright']) player.vx = player.speed

      player.x += player.vx
      player.y += player.vy

      // Keep player in bounds
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x))
      player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y))

      // Draw player
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height)

      // Draw crosshair
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(player.x, player.y, 20, 0, Math.PI * 2)
      ctx.stroke()

      // Update and draw beasts
      gameStateRef.current.beasts.forEach((beast, index) => {
        beast.update()
        beast.draw(ctx)

        // Check collision with player
        if (beast.collidesWithPlayer(player)) {
          player.health -= 0.5
          setHealth(Math.max(0, player.health))
          if (player.health <= 0) {
            gameStateRef.current.gameOver = true
            setGameOver(true)
          }
        }
      })

      // Update and draw projectiles
      gameStateRef.current.projectiles = gameStateRef.current.projectiles.filter((projectile) => {
        projectile.update()
        projectile.draw(ctx)

        // Check collision with beasts
        let hit = false
        gameStateRef.current.beasts = gameStateRef.current.beasts.filter((beast, index) => {
          if (beast.collidesWith(projectile)) {
            beast.health -= 25
            hit = true
            if (beast.health <= 0) {
              gameStateRef.current.score += 100
              setScore(gameStateRef.current.score)
              return false
            }
          }
          return true
        })

        return !hit && !projectile.isOffScreen(canvas.width, canvas.height)
      })

      // Spawn new wave if all beasts defeated
      if (gameStateRef.current.beasts.length === 0 && !gameStateRef.current.gameOver) {
        gameStateRef.current.wave++
        setWave(gameStateRef.current.wave)
        spawnBeasts(2 + gameStateRef.current.wave)
      }

      if (!gameStateRef.current.gameOver) {
        animationId = requestAnimationFrame(gameLoop)
      }
    }

    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('click', handleMouseClick)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const handleRestart = () => {
    window.location.reload()
  }

  return (
    <>
      <canvas ref={canvasRef}></canvas>
      <div className="game-ui">
        <div className="score-display">Score: {score}</div>
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${Math.max(0, health)}%` }}></div>
        </div>
        <div className="wave-display">Wave: {wave}</div>
        <div className="controls">
          <div>WASD - Move</div>
          <div>Click - Shoot</div>
        </div>
        <div className={`game-over ${gameOver ? 'show' : ''}`}>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <p>Wave Reached: {wave}</p>
          <button onClick={handleRestart}>Play Again</button>
        </div>
      </div>
    </>
  )
}

export default App
