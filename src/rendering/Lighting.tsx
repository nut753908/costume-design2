export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#fff7e8', '#3a3a4a', 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
    </>
  );
}
