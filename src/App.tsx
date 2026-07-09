import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { OrbitControls } from '@react-three/drei'
import Machine from './components/Machine'
import Prizes from './components/Prizes'
import ClawStateMachine from './components/ClawStateMachine'
import ChuteSensor from './components/ChuteSensor'
import OperatorController from './components/OperatorController'
import Hud from './ui/Hud'
import { useControls } from './hooks/useControls'
import { DEBUG_PHYSICS } from './config'
import { useStore } from './store'

export default function App() {
  useControls()
  const mode = useStore((s) => s.mode)

  return (
    <>
      <Canvas shadows camera={{ position: [0, 2.4, 5.2], fov: 42 }}>
        <color attach="background" args={['#1a1a2e']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[0, 2.0, 0]} intensity={0.6} />
        <OrbitControls
          target={[0, 1.1, 0]}
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={0.9}
          maxPolarAngle={1.5}
          minAzimuthAngle={-0.7}
          maxAzimuthAngle={0.7}
        />
        <Suspense fallback={null}>
          <Physics debug={DEBUG_PHYSICS}>
            <Machine />
            <Prizes />
            <ClawStateMachine />
            <ChuteSensor />
            {mode === 'operator' && <OperatorController />}
          </Physics>
        </Suspense>
      </Canvas>
      <Hud />
    </>
  )
}
