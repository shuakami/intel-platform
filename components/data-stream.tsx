"use client"

import { useEffect, useState } from "react"

type Particle = {
  id: number
  left: string
  animationDelay: string
  animationDuration: string
}

export default function DataStream() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = []

      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${4 + Math.random() * 4}s`,
        })
      }

      setParticles(newParticles)
    }

    generateParticles()
  }, [])

  return (
    <div className="data-stream">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="data-particle"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  )
}
