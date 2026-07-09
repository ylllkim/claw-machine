import { useStore } from '../store'
import Plushie from './Plushie'

export default function Prizes() {
  const plushies = useStore((s) => s.plushies)
  return (
    <>
      {plushies.map((p) => (
        <Plushie key={p.uid} instance={p} />
      ))}
    </>
  )
}
